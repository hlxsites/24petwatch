import { jsx } from '../../scripts/scripts.js';

// link to the 24PetWatch website to buy pet tags
const buyNowLink = 'https://www.24petwatch.com/ca/lost-pet-protection/pet-tags/tag-quote';
// path to the images for pet tags
const imagePath = '/images/tags/';
// prices for pet tags
const pricePerTagMetal = 11.95;
const pricePerTagLifetimeSmall = 17.95;
const pricePerTagLifetimeLarge = 19.95;

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
  block.innerHTML = jsx`
    <!-- lifetime tags -->
    <form id="pet-tags-lifetime-form" class="content-center">
      <div class="title-wrapper">
        <div class="title-column">
          <h4>Lifetime Warranty ID Tags</h4>
        </div>
        <div class="title-column">
          <p class="price">Small: $${pricePerTagLifetimeSmall}</p>
          <p>(plus shipping)</p>
        </div>
        <div class="title-column">
          <p class="price">Large: $${pricePerTagLifetimeLarge}</p>
          <p>(plus shipping)</p>
        </div>
      </div>
      <div class="wrapper grid-wrapper-x4">
        <div class="col1 image-above-text">
          <img id="imageTagTypeLifetime" src="${imagePath}traditional-bone.png" alt="traditional bone lifetime tag">
          <a href="${buyNowLink}">
            <button type="button">Buy Now</button>
          </a>
        </div>
        <div class="col2">
          <h5>Choose from 2 prints:</h5>
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
          <h5>Choose from 2 shapes:</h5>
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
          <h5>Key features:</h5>
            <ul>
              <li>Made of steel with a special coating for a porcelain look and feel</li>
              <li>Lifetime warranty if the tag is damaged or unreadable (not if it's lost)</li>
              <li>Long lasting and durable</li>
              <li>Includes your pet's name and unique microchip number</li>
            </ul>
        </div>
      </div>
    </form>
    <!-- metal tags -->
    <form id="pet-tags-metal-form">
      <div class="title-wrapper">
        <div class="title-column">
          <h4>Standard Metal ID Tags</h4>
        </div>
        <div class="title-column">
          <p class="price">$${pricePerTagMetal}</p>
          <p>(plus shipping)</p>
        </div>
      </div>
      <div class="wrapper grid-wrapper-x4">
        <div class="col1 image-above-text">
          <img id="imageTagTypeMetal" src="${imagePath}teal-heart.png" alt="teal heart metal tag">
          <a href="${buyNowLink}">
            <button type="button">Buy Now</button>
          </a>
        </div>
        <div class="col2">
          <h5>Choose from 3 colors:</h5>
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
          <h5>Choose from 2 shapes:</h5>
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
          <h5>Key features:</h5>
            <ul>
              <li>Long lasting and durable</li>
              <li>Includes your pet's name and unique microchip number</li>
            </ul>
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
