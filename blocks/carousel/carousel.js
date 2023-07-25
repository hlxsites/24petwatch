function mod(n, m) {
  return ((n % m) + m) % m;
}

function handleCarouselAction(block, direction) {
  const itemCount = block.children.length;
  const indicators = [...block.parentElement.querySelector('.indicators').children];
  for (let i = 0; i < itemCount; i += 1) {
    if (block.children[i].classList.contains('active')) {
      block.children[i].classList.remove('active');
      indicators[i].classList.remove('active');

      const nextActive = mod(i + direction, itemCount);
      block.children[nextActive].classList.add('active');
      indicators[nextActive].classList.add('active');
      break;
    }
  }
}

function appendCarouselActions(block) {
  const carouselWrapper = block.parentElement;
  const carouselActions = document.createElement('div');
  carouselActions.classList.add('carousel-actions');

  const prevButton = document.createElement('button');
  prevButton.classList.add('previous');
  prevButton.setAttribute('aria-label', 'Previous');
  prevButton.setAttribute('type', 'button');
  prevButton.innerHTML = '<span class="previous-icon"></span>';

  const nextButton = document.createElement('button');
  nextButton.classList.add('next');
  nextButton.setAttribute('aria-label', 'Next');
  nextButton.setAttribute('type', 'button');
  nextButton.innerHTML = '<span class="next-icon"></span>';

  prevButton.addEventListener('click', handleCarouselAction.bind(null, block, -1));
  nextButton.addEventListener('click', handleCarouselAction.bind(null, block, 1));

  carouselActions.append(prevButton, nextButton);
  carouselWrapper.append(carouselActions);
}

function appendCarouselIndicators(block) {
  const indicatorContainer = document.createElement('ol');
  indicatorContainer.classList.add('indicators');
  [...block.children].forEach((child, i) => {
    const indicator = document.createElement('li');
    if (i === 0) indicator.classList.add('active');
    indicatorContainer.append(indicator);
  });
  block.parentElement.append(indicatorContainer);
}

export default function decorate(block) {
  appendCarouselActions(block);
  appendCarouselIndicators(block);

  const cards = [...block.children];
  cards[0].classList.add('active');
}
