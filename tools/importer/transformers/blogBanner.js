function blogBanner(main, document) {

    // Banner image is in mainContent element
    const bannerImage = main.querySelector('#mainContent img');

    if( bannerImage ){

        // Create div to hold image
        const div = document.createElement('div');
        const img = document.createElement('img');
        const imgSrc = bannerImage.getAttribute('src');
        img.setAttribute('src', imgSrc);
        div.append(img);

        main.prepend(div);

    }

    // const p = document.createElement('p');
    // p.textContent = 'Hello world!';
    // main.append(p);


}

export default blogBanner;
