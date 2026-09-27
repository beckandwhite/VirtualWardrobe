import { initStore } from '../../src/store/db';
import { r } from '../../src/store/repo';

let schemaReady = false;
const events: string[] = [];
const mockDatabase = {
   execAsync: jest.fn(async () => {
      events.push('schema');
      schemaReady = true;
   }),
   getFirstAsync: jest.fn(async () => {
      events.push('settings-read');
      return null;
   }),
   getAllAsync: jest.fn(async () => {
      events.push(schemaReady ? 'store-query-after-schema' : 'store-query-before-schema');
      return [];
   }),
   runAsync: jest.fn(async () => ({ lastInsertRowId: 0, changes: 1 })),
};

jest.mock('expo-sqlite', () => ({
   openDatabaseAsync: jest.fn(async () => mockDatabase),
}));

describe('cold store initialization', () => {
   beforeEach(() => {
      schemaReady = false;
      events.length = 0;
      jest.clearAllMocks();
   });

   it('completes migrations before a concurrent store query', async () => {
      await Promise.all([initStore(), r.listStoreItems()]);

      expect(events).toContain('schema');
      expect(events).toContain('store-query-after-schema');
      expect(events).not.toContain('store-query-before-schema');
   });
});
