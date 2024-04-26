import { jsx } from '../../scripts/scripts.js';

export default async function decorate(block) {
  block.innerHTML = jsx`
    <div class="lost-pet-poster-generator-form">
      <p><i>*All fields are required unless marked as 'Optional'.</i></p>
      <h3>Pet details</h3>
      <div class="wrapper">
        <label for="imageFile" id="imageFileLabel"><div class="file-info">Upload a photo (max 2MB, supported formats: .jpg, .jpeg, .png)*</div>
          <div id="imageFileWrapper">
            <span id="fileLabel"></span>
            <input type="file" id="imageFile" name="imageFile" accept="image/png, image/jpeg" required>
          </div>
        </label>
      </div>
      <div class="wrapper">
        <input type="text" id="petName" name="petName" placeholder="Pet Name" maxlength="12" required>
        <label for="petName" class="float-label">Pet name*</label>
      </div>
      <div class="wrapper">
        <input type="number" id="petWeight" name="petWeight" placeholder="Weight" maxlength="3">
        <label for="petWeight" class="float-label">Weight (lbs. or kgs., optional)</label>
      </div>
      <div class="wrapper">
        <input type="text" id="petBreed" name="petBreed" placeholder="Breed" maxlength="30" required>
        <label for="petBreed" class="float-label">Breed*</label>
      </div>
      <div class="wrapper">
        <input type="number" id="petAge" name="petAge" placeholder="Age in Years" maxlength="2">
        <label for="petAge" class="float-label">Age (years, optional)</label>
      </div>
      <div class="wrapper">
        <input type="text" id="petColor" name="petColor" placeholder="Color" maxlength="30" required>
        <label for="petColor" class="float-label">Color*</label>
      </div>
      <h3>Contact information</h3>
      <div class="wrapper">
        <input type="text" id="petOwnerName" name="petOwnerName" placeholder="Owner&#39;s name" maxlength="40" required>
        <label for="petOwnerName" class="float-label">Owner&#39;s name*</label>
      </div>
      <div class="wrapper">
        <input type="number" id="phone" name="phone" placeholder="Phone" maxlength="10">
        <label for="phone" class="float-label">Phone number*</label>
      </div>
      <div class="wrapper">
        <input type="email" id="email" name="email" placeholder="Email" maxlength="40" required>
        <label for="email" class="float-label">Email*</label>
      </div>
      <h3>Last seen location</h3>
      <div class="wrapper">
        <input type="text" id="city" name="city" placeholder="City" maxlength="35" required>
        <label for="city" class="float-label">City*</label>
      </div>
      <div class="wrapper">
        <input type="text" id="address" name="address" placeholder="Intersection / Address" maxlength="28" required>
        <label for="address" class="float-label">Intersection / Address*</label>
      </div>
      <div class="wrapper">
        <label for="addInfo">Additional information - 200 characters max (optional):</label>
        <textarea id="addInfo" name="addInfo" placeholder="Share identifying details about your pet, or any other helpful info." maxlength="200" rows="2"></textarea>
      </div>
    </div>
    `;

  // Image file input code
  const fileInput = document.querySelector('#imageFile');
  const fileLabel = document.querySelector('#fileLabel');
  const defaultLabelTxt = 'Choose File';
  fileLabel.textContent = defaultLabelTxt;

  // eslint-disable-next-line func-names
  fileInput.addEventListener('change', function () {
    if (this.files && this.files.length > 0) {
      fileLabel.textContent = this.files[0].name;
    } else {
      fileLabel.textContent = defaultLabelTxt;
    }
  });

  document.querySelector('.lost-pet-poster-generator-form').addEventListener('input', function (e) {
    const el = e.target;
    if (el.type === 'number') {
      if (el.value.length > el.maxLength) {
        el.value = el.value.substring(0, el.maxLength);
      }
    }
  });
}
