// Hero images for form layouts
export const HERO_IMAGES = [
  'https://i.postimg.cc/g0GTnCtQ/hp-Img-1767606926.png',
  'https://i.postimg.cc/pdP6pw1N/hp-Img-1767771284.png',
  'https://i.postimg.cc/6QBmyk1J/hp-Img-1767771466.png',
  'https://i.postimg.cc/Dz7M89pR/hp-Img-1767780934.png',
  'https://i.postimg.cc/XvxDFstP/hp-Img-1767781454.png',
  'https://i.postimg.cc/FKhB7Mnm/hp-Img-1767781553.png',
  'https://i.postimg.cc/MTT3YyS1/hp-Img-1768306696.jpg',
  'https://i.postimg.cc/C1QPrzMp/hp-Img-1768322335.png',
  'https://i.postimg.cc/RFDspNSj/hp-Img-1768322463.png',
  'https://i.postimg.cc/MTFP3v6L/hp-Img-1768322538.png',
  'https://i.postimg.cc/fySHGDkb/hp-Img-1770172692.png',
  'https://i.postimg.cc/GtTMWd9B/hp-Img-1770172698.png',
  'https://i.postimg.cc/90wx6CzD/hp-Img-1770172704.png',
  'https://i.postimg.cc/tJnrKp7F/hp-Img-1770172721.png',
  'https://i.postimg.cc/BbPhr4br/hp-Img-1770172966.png',
  'https://i.postimg.cc/rmPnZKyL/hp-Img-1770173953.png',
  'https://i.postimg.cc/kGRj0qDN/hp-Img-1771410190.jpg',
  'https://i.postimg.cc/bdX68W2s/YXE50d-Ou-KTe8Us0EUBw3.jpg',
];

export const getRandomHeroImage = (): string => {
  return HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)];
};