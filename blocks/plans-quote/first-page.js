import { doDecoration } from '../plans-quote-perks-decorator/plans-quote-perks-decorator.js';
import formDecoration from './form.js';

export function decorateLeftBlock(block, apiBaseUrl) {
  formDecoration(block.children[0].children[0], apiBaseUrl);
}

export function decorateRightBlock(block) {
  const grayDiv = block.children[0].children[1];
  doDecoration(grayDiv);
}
