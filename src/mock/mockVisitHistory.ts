import type { VisitLogEntry, ResidentResponse, CaptionChunk } from '../types/api';

// ============================================================
// Mock Visit History State Management (Week 2 Database)
// ============================================================
// A simple pub/sub mock database so the UI can log notes and
// new visits, and the history screen updates in real-time.
// ============================================================

type Listener = (history: VisitLogEntry[]) => void;
const listeners = new Set<Listener>();

// Initial seed data
let historyState: VisitLogEntry[] = [
  // 1. Button press — resident replied "Leaving now"
  {
    id: 'visit-001',
    event: {
      id: 'evt-001',
      eventType: 'button_press',
      timestamp: '2026-09-03T14:05:12Z',
      deviceName: 'Front Door',
      deviceId: 'device-ring-001',
    },
    captions: [
      {
        id: 'c-001-1',
        text: 'Hi, is anyone home?',
        timestamp: '2026-09-03T14:05:14Z',
        isFinal: true,
        visitId: 'visit-001',
      },
      {
        id: 'c-001-2',
        text: "I'm delivering a package from Amazon.",
        timestamp: '2026-09-03T14:05:17Z',
        isFinal: true,
        visitId: 'visit-001',
      },
    ],
    response: {
      replyId: 'leaving_now',
      replyLabel: 'Leaving now',
      respondedAt: '2026-09-03T14:05:22Z',
    },
    endedAt: '2026-09-03T14:05:35Z',
  },
  // 2. Button press — resident replied "Leave it at the door"
  {
    id: 'visit-002',
    event: {
      id: 'evt-002',
      eventType: 'button_press',
      timestamp: '2026-09-02T09:31:00Z',
      deviceName: 'Front Door',
      deviceId: 'device-ring-001',
    },
    captions: [
      {
        id: 'c-002-1',
        text: 'Hello! I have a delivery here.',
        timestamp: '2026-09-02T09:31:03Z',
        isFinal: true,
        visitId: 'visit-002',
      },
      {
        id: 'c-002-2',
        text: 'Do you want me to leave it by the door?',
        timestamp: '2026-09-02T09:31:07Z',
        isFinal: true,
        visitId: 'visit-002',
      },
    ],
    response: {
      replyId: 'leave_at_door',
      replyLabel: 'Leave it at the door',
      respondedAt: '2026-09-02T09:31:12Z',
    },
    endedAt: '2026-09-02T09:31:25Z',
  },
  // 3. Button press — no response logged (resident didn't react)
  {
    id: 'visit-003',
    event: {
      id: 'evt-003',
      eventType: 'button_press',
      timestamp: '2026-09-01T18:47:30Z',
      deviceName: 'Front Door',
      deviceId: 'device-ring-001',
    },
    captions: [
      {
        id: 'c-003-1',
        text: 'Hey, anybody there?',
        timestamp: '2026-09-01T18:47:32Z',
        isFinal: true,
        visitId: 'visit-003',
      },
    ],
    response: null,
    endedAt: '2026-09-01T18:47:55Z',
  },
  // 4. Motion detected — no captions (no one spoke)
  {
    id: 'visit-004',
    event: {
      id: 'evt-004',
      eventType: 'motion_detected',
      timestamp: '2026-08-31T22:10:05Z',
      deviceName: 'Front Door',
      deviceId: 'device-ring-001',
    },
    captions: [],
    response: null,
    endedAt: '2026-08-31T22:10:20Z',
  },
  // 5. Button press — resident replied "Wrong address"
  {
    id: 'visit-005',
    event: {
      id: 'evt-005',
      eventType: 'button_press',
      timestamp: '2026-08-30T11:22:00Z',
      deviceName: 'Front Door',
      deviceId: 'device-ring-001',
    },
    captions: [
      {
        id: 'c-005-1',
        text: "Hi, I'm looking for 42 Maple Street?",
        timestamp: '2026-08-30T11:22:03Z',
        isFinal: true,
        visitId: 'visit-005',
      },
    ],
    response: {
      replyId: 'wrong_address',
      replyLabel: 'Wrong address',
      respondedAt: '2026-08-30T11:22:08Z',
    },
    endedAt: '2026-08-30T11:22:15Z',
  },
];

function notify() {
  const current = [...historyState];
  listeners.forEach((fn) => fn(current));
}

export function subscribeMockHistory(callback: Listener): () => void {
  listeners.add(callback);
  callback([...historyState]);
  return () => {
    listeners.delete(callback);
  };
}

export function getMockHistory() {
  return [...historyState];
}

export function addVisitToMockHistory(visit: VisitLogEntry) {
  // Add to the front so it's most recent
  historyState = [visit, ...historyState];
  notify();
}

export function appendCaptionToMockVisit(visitId: string, chunk: CaptionChunk) {
  historyState = historyState.map(visit => {
    if (visit.id === visitId) {
      return { ...visit, captions: [...visit.captions, chunk] };
    }
    return visit;
  });
  notify();
}

export function replaceCaptionsInMockVisit(visitId: string, chunks: CaptionChunk[]) {
  historyState = historyState.map(visit => {
    if (visit.id === visitId) {
      return { ...visit, captions: chunks };
    }
    return visit;
  });
  notify();
}

export function logResponseToMockHistory(visitId: string, response: ResidentResponse) {
  historyState = historyState.map(visit => {
    if (visit.id === visitId) {
      return { ...visit, response };
    }
    return visit;
  });
  notify();
}

export function endMockVisit(visitId: string) {
  historyState = historyState.map(visit => {
    if (visit.id === visitId) {
      return { ...visit, endedAt: new Date().toISOString() };
    }
    return visit;
  });
  notify();
}
