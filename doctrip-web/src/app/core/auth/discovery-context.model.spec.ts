import { convertToParamMap } from '@angular/router';
import {
  compactDiscoveryContext,
  isDiscoveryContextEmpty,
  readDiscoveryContext,
} from './discovery-context.model';

describe('discovery-context.model', () => {
  describe('compactDiscoveryContext', () => {
    it('keeps only fields that were actually provided', () => {
      expect(compactDiscoveryContext({ treatmentPackageId: '1' })).toEqual({
        treatmentPackageId: '1',
      });
    });

    it('returns an empty object for empty context, never fabricating fields', () => {
      expect(compactDiscoveryContext({})).toEqual({});
    });

    it('carries hospital, department, and doctor context when present', () => {
      expect(
        compactDiscoveryContext({ hospitalId: 'h1', department: 'Cardiology', doctorId: 'd1' }),
      ).toEqual({ hospitalId: 'h1', department: 'Cardiology', doctorId: 'd1' });
    });
  });

  describe('readDiscoveryContext', () => {
    it('reads recognized context fields from a param map', () => {
      const params = convertToParamMap({ treatmentPackageId: '1', unrelated: 'x' });
      expect(readDiscoveryContext(params)).toEqual({ treatmentPackageId: '1' });
    });

    it('returns an empty context when no recognized fields are present', () => {
      const params = convertToParamMap({});
      expect(readDiscoveryContext(params)).toEqual({});
    });
  });

  describe('isDiscoveryContextEmpty', () => {
    it('is true for an empty context', () => {
      expect(isDiscoveryContextEmpty({})).toBe(true);
    });

    it('is false when any field is present', () => {
      expect(isDiscoveryContextEmpty({ doctorId: 'd1' })).toBe(false);
    });
  });
});
