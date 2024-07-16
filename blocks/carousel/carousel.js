function mod(n, m) {
  return ((n % m) + m) % m;
}

function handleCarouselAction(block, direction, targetIndex = null) {
  const itemCount = block.children.length;
  const indicators = [...block.parentElement.querySelector('.indicators').children];
  let currentActiveIndex = 0;
  for (let i = 0; i < itemCount; i += 1) {
    if (block.children[i].classList.contains('active')) {
      currentActiveIndex = i;
      break;
    }
  }

  block.children[currentActiveIndex].classList.remove('active');
  indicators[currentActiveIndex].classList.remove('active');

  let nextActive = targetIndex !== null
    ? targetIndex
    : mod(currentActiveIndex + direction, itemCount);

  if (block.children[nextActive] && indicators[nextActive]) {
    block.children[nextActive].classList.add('active');
    indicators[nextActive].classList.add('active');
  } else {
    nextActive = 0;
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

  prevButton.addEventListener('click', () => handleCarouselAction(block, -1));
  nextButton.addEventListener('click', () => handleCarouselAction(block, 1));

  carouselActions.append(prevButton, nextButton);
  carouselWrapper.append(carouselActions);
}

function appendCarouselIndicators(block) {
  const indicatorContainer = document.createElement('ol');
  indicatorContainer.classList.add('indicators');
  [...block.children].forEach((child, i) => {
    const indicator = document.createElement('li');
    if (i === 0) indicator.classList.add('active');
    indicator.setAttribute('aria-label', `Slide ${i + 1}`);
    indicator.addEventListener('click', () => handleCarouselAction(block, 0, i)); // Directly set

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
