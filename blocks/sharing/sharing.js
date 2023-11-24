export default async function decorate(block) {
  block.append(document.createRange().createContextualFragment('<div class="sharethis-inline-share-buttons"></div>'));
}
