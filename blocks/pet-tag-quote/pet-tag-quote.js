import {
  STEP_1_URL,
  STEP_2_URL,
  STEP_3_URL,
} from './tag-utils.js';
import decorateStep1 from './tag-quote.js';
import decorateStep2 from './tag-select.js';
import decorateStep3 from './summary-quote.js';

export default async function decorate(block) {
  const currentPath = window.location.pathname;
  if (currentPath.includes(STEP_1_URL)) {
    decorateStep1(block); // tag-quote
  } else if (currentPath.includes(STEP_2_URL)) {
    decorateStep2(block); // tag-select
  } else if (currentPath.includes(STEP_3_URL)) {
    decorateStep3(block); // summary-quote
  } else {
    decorateStep1(block); // default
  }
}
