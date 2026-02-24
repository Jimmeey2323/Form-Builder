export interface HeroImage {
  id: string;
  url: string;
  category: 'photography' | 'abstract' | 'gradient' | 'lifestyle';
}

export const heroImages: HeroImage[] = [
  { id: 'hero-1', url: 'https://i.postimg.cc/g0GTnCtQ/hp-Img-1767606926.png', category: 'abstract' },
  { id: 'hero-2', url: 'https://i.postimg.cc/pdP6pw1N/hp-Img-1767771284.png', category: 'gradient' },
  { id: 'hero-3', url: 'https://i.postimg.cc/6QBmyk1J/hp-Img-1767771466.png', category: 'abstract' },
  { id: 'hero-4', url: 'https://i.postimg.cc/Dz7M89pR/hp-Img-1767780934.png', category: 'photography' },
  { id: 'hero-5', url: 'https://i.postimg.cc/XvxDFstP/hp-Img-1767781454.png', category: 'gradient' },
  { id: 'hero-6', url: 'https://i.postimg.cc/FKhB7Mnm/hp-Img-1767781553.png', category: 'photography' },
  { id: 'hero-7', url: 'https://i.postimg.cc/MTT3YyS1/hp-Img-1768306696.jpg', category: 'photography' },
  { id: 'hero-8', url: 'https://i.postimg.cc/C1QPrzMp/hp-Img-1768322335.png', category: 'abstract' },
  { id: 'hero-9', url: 'https://i.postimg.cc/RFDspNSj/hp-Img-1768322463.png', category: 'gradient' },
  { id: 'hero-10', url: 'https://i.postimg.cc/MTFP3v6L/hp-Img-1768322538.png', category: 'abstract' },
  { id: 'hero-11', url: 'https://i.postimg.cc/fySHGDkb/hp-Img-1770172692.png', category: 'photography' },
  { id: 'hero-12', url: 'https://i.postimg.cc/GtTMWd9B/hp-Img-1770172698.png', category: 'photography' },
  { id: 'hero-13', url: 'https://i.postimg.cc/90wx6CzD/hp-Img-1770172704.png', category: 'abstract' },
  { id: 'hero-14', url: 'https://i.postimg.cc/tJnrKp7F/hp-Img-1770172721.png', category: 'gradient' },
  { id: 'hero-15', url: 'https://i.postimg.cc/BbPhr4br/hp-Img-1770172966.png', category: 'photography' },
  { id: 'hero-16', url: 'https://i.postimg.cc/rmPnZKyL/hp-Img-1770173953.png', category: 'abstract' },
  { id: 'hero-17', url: 'https://i.postimg.cc/kGRj0qDN/hp-Img-1771410190.jpg', category: 'photography' },
  { id: 'hero-18', url: 'https://i.postimg.cc/bdX68W2s/YXE50d-Ou-KTe8Us0EUBw3.jpg', category: 'lifestyle' },
  { id: 'hero-19', url: 'https://i.postimg.cc/mrX0z7pT/hp-Img-1771951159.png', category: 'abstract' },
  { id: 'hero-20', url: 'https://i.postimg.cc/FKsMHTph/hp-Img-1771951405-2.png', category: 'gradient' },
  { id: 'hero-21', url: 'https://i.postimg.cc/GphWmXKh/hp-Img-1771951422.png', category: 'photography' },
  { id: 'hero-22', url: 'https://i.postimg.cc/Dzy9wx6w/hp-Img-1771951432.png', category: 'abstract' },
  { id: 'hero-23', url: 'https://i.postimg.cc/mr2vgmjs/hp-Img-1771951462.png', category: 'gradient' },
  { id: 'hero-24', url: 'https://i.postimg.cc/HLsqk62q/hp-Img-1771952124.png', category: 'abstract' },
  { id: 'hero-25', url: 'https://i.postimg.cc/jjdpSMc0/hp-Img-1771959430.png', category: 'photography' },
  { id: 'hero-26', url: 'https://i.postimg.cc/43NDxW5F/hp-Img-1771959633.png', category: 'gradient' },
  { id: 'hero-27', url: 'https://i.postimg.cc/mr2vgmw5/hp-Img-1771959864.png', category: 'abstract' },
  { id: 'hero-28', url: 'https://i.postimg.cc/7ZVv4Fgp/hp-Img-1771959875.png', category: 'photography' },
  { id: 'hero-29', url: 'https://i.postimg.cc/cLmqWpQ2/hp-Img-1771959901.png', category: 'gradient' },
  { id: 'hero-30', url: 'https://i.postimg.cc/pLxNgWn8/hp-Img-1771960179-2.png', category: 'abstract' },
  { id: 'hero-31', url: 'https://i.postimg.cc/Sxr04BWL/hp-Img-1771960189.png', category: 'photography' },
  { id: 'hero-32', url: 'https://i.postimg.cc/QdbLD2pk/hp-Img-1771960829.png', category: 'gradient' },
  { id: 'hero-33', url: 'https://i.postimg.cc/DwgVh9q4/hp-Img-1771960839.png', category: 'abstract' },
  { id: 'hero-34', url: 'https://i.postimg.cc/kgcrC0xV/hp-Img-1771961138.png', category: 'photography' },
  { id: 'hero-35', url: 'https://i.postimg.cc/rwJ6TBSD/hp-Img-1771961157.png', category: 'gradient' },
  { id: 'hero-36', url: 'https://i.postimg.cc/bw8XKy22/hp-Img-1771961170.png', category: 'abstract' },
  { id: 'hero-37', url: 'https://i.postimg.cc/NjYhWsrX/hp-Img-1771961278.png', category: 'photography' },
  { id: 'hero-38', url: 'https://i.postimg.cc/jSKVGxJP/hp-Img-1771961287.png', category: 'gradient' },
];

export function getRandomHeroImage(): HeroImage {
  return heroImages[Math.floor(Math.random() * heroImages.length)];
}
