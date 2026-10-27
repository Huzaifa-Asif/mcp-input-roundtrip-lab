const encoder = new TextEncoder();
export const LIMITS = Object.freeze({ maxBytes: 2_097_152, maxSteps: 2_000, maxFindings: 500, maxDepth: 256, maxContainers: 100_000, maxEvidence: 180 });
const clean = value => String(value ?? '').replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').slice(0, LIMITS.maxEvidence);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function preflight(root) {
  const stack = [{ value: root, depth: 0, exit: false }]; const active = new Set(); let containers = 0;
  while (stack.length) {
    const item = stack.pop(); const { value, depth } = item;
    if (!value || typeof value !== 'object') continue;
    if (item.exit) { active.delete(value); continue; }
    if (depth > LIMITS.maxDepth) throw new Error(`JSON nesting exceeds ${LIMITS.maxDepth} levels.`);
    if (active.has(value)) throw new Error('Input must not contain circular values.');
    if (++containers > LIMITS.maxContainers) throw new Error(`Input exceeds ${LIMITS.maxContainers} containers.`);
    active.add(value); stack.push({ value, depth, exit: true });
    const children = Array.isArray(value) ? value : Object.values(value);
    for (let index = children.length - 1; index >= 0; index -= 1) stack.push({ value: children[index], depth: depth + 1, exit: false });
  }
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (isObject(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value) ?? 'undefined';
}

function baseParams(params) {
  if (!isObject(params)) return {};
  return Object.fromEntries(Object.entries(params).filter(([key]) => !['_meta', 'inputResponses', 'requestState'].includes(key)));
}

function getSteps(input) {
  const steps = Array.isArray(input) ? input : input?.steps;
  if (!Array.isArray(steps)) throw new Error('Expected a step array or {"steps":[…]}.');
  if (steps.length > LIMITS.maxSteps) throw new Error(`Transcript exceeds ${LIMITS.maxSteps} steps.`);
  return steps;
}

export function analyzeTranscript(input) {
  preflight(input);
  const sourceBytes = encoder.encode(JSON.stringify(input)).length;
  if (sourceBytes > LIMITS.maxBytes) throw new Error(`Input exceeds ${LIMITS.maxBytes} serialized UTF-8 bytes.`);
  const steps = getSteps(input); const errors = []; const ordinary = []; let dropped = 0; let errorCount = 0;
  const add = (code, severity, step, flow, message, evidence = '') => {
    const finding = { code, severity, step, flow, message, evidence: clean(evidence) };
    if (severity === 'error') { errorCount += 1; if (errors.length < LIMITS.maxFindings) errors.push(finding); else dropped += 1; }
    else if (ordinary.length < LIMITS.maxFindings) ordinary.push(finding); else dropped += 1;
  };
  const pending = new Map(); const flows = []; let requestCount = 0; let responseCount = 0;
  const findFlow = (method, params) => {
    const state = typeof params?.requestState === 'string' ? params.requestState : undefined;
    const fingerprint = stable(baseParams(params));
    const candidates = flows.filter(flow => flow.awaiting && flow.method === method && flow.fingerprint === fingerprint);
    return candidates.find(flow => flow.requestState === undefined || flow.requestState === state) ?? (candidates.length === 1 ? candidates[0] : undefined);
  };

  steps.forEach((step, index) => {
    const position = index + 1;
    if (!isObject(step) || !['client_to_server', 'server_to_client'].includes(step.direction) || !isObject(step.message)) {
      add('invalid_step', 'error', position, null, 'Each step needs a valid direction and message object.'); return;
    }
    const message = step.message;
    if (step.direction === 'client_to_server' && typeof message.method === 'string' && Object.hasOwn(message, 'id')) {
      requestCount += 1; const idKey = stable(message.id); const params = isObject(message.params) ? message.params : {};
      if (pending.has(idKey)) add('duplicate_pending_id', 'error', position, null, 'Request ID is already awaiting a response.', idKey);
      const hasRoundtripFields = Object.hasOwn(params, 'inputResponses') || Object.hasOwn(params, 'requestState');
      const flow = hasRoundtripFields ? findFlow(message.method, params) : undefined;
      if (hasRoundtripFields && !flow) add('orphan_retry', 'error', position, null, 'Retry fields do not match an awaiting input_required flow.', message.method);
      if (flow) {
        if (flow.requestIds.has(idKey)) add('reused_request_id', 'error', position, flow.id, 'A retry must use a fresh JSON-RPC request ID.', idKey);
        if (flow.requestState !== undefined && params.requestState !== flow.requestState) add('request_state_mismatch', 'error', position, flow.id, 'Retry did not echo requestState byte-for-byte.');
        const responses = params.inputResponses;
        if (flow.outstanding.size && !isObject(responses)) add('missing_input_responses', 'error', position, flow.id, 'Retry is missing the inputResponses object.');
        if (isObject(responses)) {
          for (const key of Object.keys(responses)) if (!flow.outstanding.has(key)) add('unknown_input_response', 'error', position, flow.id, 'inputResponses contains a key that is not outstanding.', key);
          for (const key of flow.outstanding) if (!Object.hasOwn(responses, key)) add('missing_input_response', 'error', position, flow.id, 'Retry omits an outstanding input response.', key);
        }
        flow.awaiting = false; flow.requestIds.add(idKey); flow.rounds += 1;
        if (flow.rounds > 20) add('excessive_rounds', 'warning', position, flow.id, 'Flow exceeds the review threshold of 20 rounds.', String(flow.rounds));
      }
      pending.set(idKey, { position, method: message.method, params, flow }); return;
    }
    if (step.direction === 'server_to_client' && Object.hasOwn(message, 'id') && !Object.hasOwn(message, 'method')) {
      responseCount += 1; const idKey = stable(message.id); const request = pending.get(idKey);
      if (!request) { add('orphan_response', 'error', position, null, 'Response does not match a pending request.', idKey); return; }
      pending.delete(idKey);
      if (Object.hasOwn(message, 'error')) { if (request.flow) request.flow.terminal = 'error'; return; }
      const result = message.result;
      if (!isObject(result)) { add('invalid_result', 'error', position, request.flow?.id ?? null, 'Successful response result must be an object.'); return; }
      if (result.resultType === 'input_required') {
        const inputRequests = result.inputRequests; const hasRequests = isObject(inputRequests) && Object.keys(inputRequests).length > 0;
        const hasState = typeof result.requestState === 'string';
        if (!['tools/call', 'prompts/get', 'resources/read'].includes(request.method)) add('unsupported_input_required_method', 'error', position, request.flow?.id ?? null, 'input_required is not allowed for this client request method in this analyzer scope.', request.method);
        if (!hasRequests && !hasState) add('empty_input_required', 'error', position, request.flow?.id ?? null, 'input_required needs inputRequests or requestState.');
        if (Object.hasOwn(result, 'inputRequests') && !isObject(inputRequests)) add('invalid_input_requests', 'error', position, request.flow?.id ?? null, 'inputRequests must be an object map.');
        if (isObject(inputRequests) && Object.keys(inputRequests).length === 0) add('empty_input_requests', 'error', position, request.flow?.id ?? null, 'When present, inputRequests must contain one or more keyed requests.');
        if (Object.hasOwn(result, 'requestState') && typeof result.requestState !== 'string') add('invalid_request_state', 'error', position, request.flow?.id ?? null, 'requestState must be an opaque string.');
        const flow = request.flow ?? { id: `flow-${flows.length + 1}`, method: request.method, fingerprint: stable(baseParams(request.params)), requestIds: new Set([idKey]), seenKeys: new Set(), rounds: 1, terminal: null };
        if (!request.flow) flows.push(flow);
        flow.awaiting = true; flow.requestState = hasState ? result.requestState : undefined; flow.outstanding = new Set(hasRequests ? Object.keys(inputRequests) : []);
        for (const [key, value] of hasRequests ? Object.entries(inputRequests) : []) {
          if (flow.seenKeys.has(key)) add('reused_input_key', 'error', position, flow.id, 'An input request key was reused during the same flow.', key);
          flow.seenKeys.add(key);
          if (!isObject(value) || !['elicitation/create', 'sampling/createMessage', 'roots/list'].includes(value.method)) add('unsupported_input_method', 'warning', position, flow.id, 'Input request uses an unexpected method.', value?.method ?? key);
        }
      } else if (request.flow) {
        const terminalType = result.resultType === undefined ? 'complete' : result.resultType;
        if (terminalType !== 'complete') add('invalid_terminal_result_type', 'error', position, request.flow.id, 'A retry response must be complete or omit resultType for backward compatibility.', terminalType);
        request.flow.terminal = terminalType === 'complete' ? 'complete' : 'invalid'; request.flow.awaiting = false;
      }
      return;
    }
    if (Object.hasOwn(message, 'id')) add('unexpected_message_shape', 'warning', position, null, 'Message is not a recognized client request or server response.');
  });
  for (const request of pending.values()) add('missing_response', 'warning', request.position, request.flow?.id ?? null, 'Request has no response in the transcript.', request.method);
  for (const flow of flows) if (flow.awaiting) add('incomplete_flow', 'warning', steps.length, flow.id, 'Flow ends while waiting for a retry.');
  const capacity = Math.max(0, LIMITS.maxFindings - errors.length); const findings = [...errors, ...ordinary.slice(0, capacity)]; dropped += Math.max(0, ordinary.length - capacity);
  const completeFlows = flows.filter(flow => flow.terminal === 'complete').length;
  return { version: 1, summary: { steps: steps.length, requests: requestCount, responses: responseCount, flows: flows.length, completeFlows, errorFindings: errorCount, displayedFindings: findings.length, droppedFindings: dropped, truncated: dropped > 0, sourceBytes }, flows: flows.map(flow => ({ id: flow.id, method: flow.method, rounds: flow.rounds, terminal: flow.terminal ?? (flow.awaiting ? 'awaiting_retry' : 'unknown'), inputKeys: [...flow.seenKeys] })), findings, limits: LIMITS };
}

export function parseAndAnalyze(source) {
  if (typeof source !== 'string') throw new TypeError('Source must be text.');
  if (encoder.encode(source).length > LIMITS.maxBytes) throw new Error(`Input exceeds ${LIMITS.maxBytes} UTF-8 bytes.`);
  let value; try { value = JSON.parse(source); } catch { throw new Error('Input is not valid JSON.'); }
  return analyzeTranscript(value);
}
