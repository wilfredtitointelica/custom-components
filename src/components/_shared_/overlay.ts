import { ConnectedPosition } from '@angular/cdk/overlay';

/** Below the trigger (aligned start), flipping above when there is no room. Used by Select, DatePicker, Popover. */
export const INT_DROPDOWN_POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
];

export type IntPlacement = 'top' | 'bottom' | 'left' | 'right';

const PLACEMENTS: Record<IntPlacement, ConnectedPosition> = {
  top: { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -8 },
  bottom: { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 },
  left: { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -8 },
  right: { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 8 },
};

const OPPOSITE: Record<IntPlacement, IntPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/** Preferred placement first, then its opposite as fallback (Tooltip). */
export function placementPositions(placement: IntPlacement): ConnectedPosition[] {
  return [PLACEMENTS[placement], PLACEMENTS[OPPOSITE[placement]]];
}
