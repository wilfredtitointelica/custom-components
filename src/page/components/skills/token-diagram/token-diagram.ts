import { Component } from '@angular/core';

/**
 * Token flow of a replicated component (Skill → Replicar de PrimeNG): Style Guide primitives --i-* →
 * component aliases --int-<id>-* → BEM rules. Reuses the folder diagram look; PrimeNG Aura is shown
 * as a reference only.
 */
@Component({
  selector: 'app-token-diagram',
  templateUrl: './token-diagram.html',
  styleUrls: ['../folder-diagram/folder-diagram.scss', './token-diagram.scss'],
})
export class TokenDiagram {}
