// Define the image type
export interface ImageAsset {
  src: string;
  alt: string;
}

// Export images as objects with proper typing
export const images = {
  ad: {
    src: "/assets/images/ad.png",
    alt: "ad",
  },
  air: {
    src: "/assets/images/air.jpg",
    alt: "Air view",
  },
  air2: {
    src: "/assets/images/air2.jpg",
    alt: "Air view 2",
  },
  building: {
    src: "/assets/images/building.jpg",
    alt: "Building",
  },
  cash: {
    src: "/assets/images/cash.jpg",
    alt: "Cash",
  },
  car: {
    src: "/assets/images/car.jpg",
    alt: "Car",
  },
  half: {
    src: "/assets/images/half.jpg",
    alt: "Half view",
  },
  women: {
    src: "/assets/images/women.jpg",
    alt: "Women",
  },
  placeholder: {
    src: "/assets/images/placeholder.jpg",
    alt: "Placeholder",
  },
  house_preview: {
    src: "/assets/images/house_preview.jpg",
    alt: "preview house",
  },
  car_preview: {
    src: "/assets/images/car_preview.jpg",
    alt: "preview house",
  },
  dashen: {
    src: "/assets/images/dashen.jpg",
    alt: "dashen",
  },
  awash: {
    src: "/assets/images/awash.jpg",
    alt: "awash",
  },
  new_house: {
    src: "/assets/images/new_building.jpg",
    alt: "new house",
  },
  new_car: {
    src: "/assets/images/new_car.jpg",
    alt: "new house 2",
  },
  vial_logo: {
    src: "/assets/images/vital_logo.png",
    alt: "vial logo",
  },
  vital_1: {
    src: "/assets/images/vital (1).jpg",
    alt: "vital 1",
  },
  vital_2: {
    src: "/assets/images/vital (2).jpg",
    alt: "vital 2",
  },
  vital_3: {
    src: "/assets/images/vital (3).jpg",
    alt: "vital 3",
  },
  techno_1: {
    src: "/assets/images/pic01.png",
    alt: "techno 1",
  },
  techno_2: {
    src: "/assets/images/pic02.png",
    alt: "techno 2",
  },
  techno_3: {
    src: "/assets/images/pic03.png",
    alt: "techno 3",
  },
};

// Export a function to safely get an image
export const getImage = (key: keyof typeof images): ImageAsset => {
  return images[key] || images.placeholder;
};
