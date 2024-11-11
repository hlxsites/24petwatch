import { jsx } from '../../scripts/scripts.js';

// path to the images for pet tags
const imagePath = '/images/tags/';

function updateTagImage() {
  // lifetime tags
  const imageTagTypeLifetime = document.querySelector('#imageTagTypeLifetime');
  const print = document.querySelector('input[name="prints"]:checked').value; // {traditional, paws}
  let shape = document.querySelector('input[name="shapesL"]:checked').value; // {bone/boneL, circle}
  if (shape.startsWith('bone')) {
    shape = 'bone';
  }
  imageTagTypeLifetime.src = `${imagePath}${print}-${shape}.png`;
  imageTagTypeLifetime.alt = `${print} ${shape} lifetime tag`;
  // metal tags
  const imageTagTypeMetal = document.querySelector('#imageTagTypeMetal');
  const color = document.querySelector('input[name="colors"]:checked').value; // {red, teal, charcoal}
  shape = document.querySelector('input[name="shapesM"]:checked').value; // {bone/boneM, heart}
  if (shape.startsWith('bone')) {
    shape = 'bone';
  }
  imageTagTypeMetal.src = `${imagePath}${color}-${shape}.png`;
  imageTagTypeMetal.alt = `${color} ${shape} metal tag`;
}

export default async function decorate(block) {
  const blockMetadata = {};

  // eslint-disable-next-line no-restricted-syntax
  for (const row of block.children) {
    let key = row.children[0].textContent;

    key = key.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
      if (+match === 0) return '';
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });

    const value = row.children[1].innerHTML;
    if (key) {
      blockMetadata[key] = value;
    }
  }

  const {
    primaryTagHeaderTitle,
    primaryTagHeaderContent1Top,
    primaryTagHeaderContent1Bottom,
    primaryTagHeaderContent2Top,
    primaryTagHeaderContent2Bottom,
    primaryTagCTA,
    primaryTagColumn2Title,
    primaryTagColumn3Title,
    primaryTagColumn4Title,
    primaryTagColumn4Description,
    secondaryTagHeaderTitle,
    secondaryTagHeaderContent1Top,
    secondaryTagHeaderContent1Bottom,
    secondaryTagCTA,
    secondaryTagColumn2Title,
    secondaryTagColumn3Title,
    secondaryTagColumn4Title,
    secondaryTagColumn4Description,
  } = blockMetadata;

  block.innerHTML = jsx`
    <!-- lifetime tags -->
    <form id="pet-tags-lifetime-form" class="content-center">
      <div class="title-wrapper">
        <div class="title-column">
          <h4>${primaryTagHeaderTitle}</h4>
        </div>
        <div class="title-column">
          <p class="price">${primaryTagHeaderContent1Top}</p>
          <p>${primaryTagHeaderContent1Bottom}</p>
        </div>
        <div class="title-column">
          <p class="price">${primaryTagHeaderContent2Top}</p>
          <p>${primaryTagHeaderContent2Bottom}</p>
        </div>
      </div>
      <div class="wrapper grid-wrapper-x4">
        <div class="col1 image-above-text">
          <img id="imageTagTypeLifetime" src="${imagePath}traditional-bone.png" alt="traditional bone lifetime tag">
          ${primaryTagCTA}
        </div>
        <div class="col2">
          <h5>${primaryTagColumn2Title}</h5>
          <div class="grid-wrapper-x2">
            <div class="radio-wrapper circular">
              <input type="radio" id="traditional" name="prints" value="traditional" checked>
              <label for="traditional">
                <img src="${imagePath}traditional-print.jpeg" alt="traditional print" class="outline" width="20" height="20">
              </label>
            </div>
            <div class="radio-wrapper circular">
              <input type="radio" id="paws" name="prints" value="paws">
              <label for="paws">
                <img src="${imagePath}paw-print.jpeg" alt="paw print" class="outline" width="20" height="20">
              </label>
            </div>
            <div><span class="label">Traditional</span></div>
            <div><span class="label">Paw</span></div>
          </div>
        </div>
        <div class="col3">
          <h5>${primaryTagColumn3Title}</h5>
          <div class="grid-wrapper-x2">
            <div class="radio-wrapper shape-item">
              <input type="radio" id="boneL" name="shapesL" value="boneL" checked>
              <label for="boneL">
                <img src="${imagePath}bone-outline.jpeg" alt="bone shape" class="outline" width="20" height="20">
              </label>
            </div>
            <div class="radio-wrapper shape-item">  
              <input type="radio" id="circle" name="shapesL" value="circle">
              <label for="circle">
                <img src="${imagePath}circle-outline.jpeg" alt="circle shape" class="outline" width="20" height="20">
              </label>
            </div>
            <div><span class="label">Bone</span></div>
            <div><span class="label">Circle</span></div>
          </div>
        </div>
        <div class="col4">
          <h5>${primaryTagColumn4Title}</h5>
          ${primaryTagColumn4Description}
        </div>
      </div>
    </form>
    <!-- metal tags -->
    <form id="pet-tags-metal-form">
      <div class="title-wrapper">
        <div class="title-column">
          <h4>${secondaryTagHeaderTitle}</h4>
        </div>
        <div class="title-column">
          <p class="price">${secondaryTagHeaderContent1Top}</p>
          <p>${secondaryTagHeaderContent1Bottom}</p>
        </div>
      </div>
      <div class="wrapper grid-wrapper-x4">
        <div class="col1 image-above-text">
          <img id="imageTagTypeMetal" src="${imagePath}teal-heart.png" alt="teal heart metal tag">
          ${secondaryTagCTA}
        </div>
        <div class="col2">
          <h5>${secondaryTagColumn2Title}</h5>
          <div class="grid-wrapper-x3">
            <div class="radio-wrapper circular">
              <input type="radio" id="red" name="colors" value="red">
              <label for="red">
                <img src="${imagePath}red.png" alt="red color" class="outline color-disc" width="20" height="20">
              </label>
            </div>
            <div class="radio-wrapper circular">  
              <input type="radio" id="teal" name="colors" value="teal" checked>
              <label for="teal">
                <img src="${imagePath}teal.png" alt="teal color" class="outline color-disc" width="20" height="20">
              </label>
            </div>
            <div class="radio-wrapper circular">
              <input type="radio" id="charcoal" name="colors" value="charcoal">
              <label for="charcoal">
                <img src="${imagePath}charcoal.png" alt="charcoal color" class="outline color-disc" width="20" height="20">
              </label>
            </div>
            <div><span class="label">Red</span></div>
            <div><span class="label">Teal</span></div>
            <div><span class="label">Charcoal</span></div>
          </div>
        </div>
        <div class="col3">
          <h5>${secondaryTagColumn3Title}</h5>
            <div class="grid-wrapper-x2">
            <div class="radio-wrapper shape-item">
              <input type="radio" id="boneM" name="shapesM" value="boneM">
              <label for="boneM">
                <img src="${imagePath}bone-outline.jpeg" alt="bone shape" class="outline" width="20" height="20">
              </label>
            </div>
            <div class="radio-wrapper shape-item">  
              <input type="radio" id="heart" name="shapesM" value="heart" checked>
              <label for="heart">
                <img src="${imagePath}heart-outline.jpeg" alt="heart shape" class="outline" width="20" height="20">
              </label>
            </div>
            <div><span class="label">Bone</span></div>
            <div><span class="label">Heart</span></div>
          </div>
        </div>
        <div class="col4">
          <h5>${secondaryTagColumn4Title}</h5>
          ${secondaryTagColumn4Description}
        </div>
      </div>            
    </form>
  `;

  // update tag image based on user selection
  const allRadioButtons = block.querySelectorAll('input[type="radio"]');
  allRadioButtons.forEach((radioButton) => {
    radioButton.addEventListener('change', () => {
      updateTagImage();
    });
  });
}
