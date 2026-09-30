import { processCaptureImage } from '../../src/capture/processCapture';
import { removeBackground } from '../../src/capture/removeBackground';

// #64: processCaptureImage is the single seam both capture handlers (native
// camera/library and the web file picker) funnel through after a photo is taken.
// It delegates to the platform-resolved on-device removeBackground and returns the
// cutout on success or the original on passthrough. The native module chain is
// mocked here so this runs device-free in the node suite (like draft.test.ts).
jest.mock('../../src/capture/removeBackground', () => ({
   removeBackground: jest.fn(),
}));

const mockRemove = removeBackground as jest.MockedFunction<typeof removeBackground>;

const RAW = 'file:///captures/raw.jpg';

describe('processCaptureImage', () => {
   beforeEach(() => mockRemove.mockReset());

   it('passes the captured URI to on-device background removal', async () => {
      mockRemove.mockResolvedValue({ uri: 'file:///cutout.png', removed: true });
      await processCaptureImage(RAW);
      expect(mockRemove).toHaveBeenCalledWith(RAW);
   });

   it('returns the transparent-PNG cutout when a subject was removed', async () => {
      mockRemove.mockResolvedValue({ uri: 'file:///cutout.png', removed: true });
      await expect(processCaptureImage(RAW)).resolves.toEqual({
         uri: 'file:///cutout.png',
         removed: true,
      });
   });

   it('keeps the original URI on passthrough (unsupported / no subject / failure)', async () => {
      mockRemove.mockResolvedValue({ uri: RAW, removed: false });
      await expect(processCaptureImage(RAW)).resolves.toEqual({ uri: RAW, removed: false });
   });
});
