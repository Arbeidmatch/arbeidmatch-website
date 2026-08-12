export type PortfolioCategory = { slug: string; title: string; description: string; images: string[] };

const media = (file: string) => `https://static.wixstatic.com/media/${file}`;

export const portfolioCategories: PortfolioCategory[] = [
  {
    slug: "terrasser",
    title: "Terrasser og uteareal",
    description: "Slitesterke flater, presise overganger og materialer valgt for norsk klima.",
    images: [
      "1347ef_5a6f66b65a0e471aba431bf609b26b14~mv2.jpg", "1347ef_ee5563f0eb8441f1b78f204f6c097978~mv2.jpg",
      "1347ef_1350f24098354c9d916a64429559a1bb~mv2.jpg", "1347ef_7a57f81d6aea4f0387612e4f3eb9b06f~mv2.jpg",
      "1347ef_4341e45c0fee4fdabbc355b66edb8429~mv2.jpg", "1347ef_746a1a3beb2f4f6c969a5447de218858~mv2.jpg",
      "1347ef_6d876390bc814872a3c37144cc1726e8~mv2.jpg",
    ].map(media),
  },
  {
    slug: "venetiansk-stukkatur",
    title: "Venetiansk stukkatur",
    description: "Polerte, marmorlignende veggflater med dybde, glans og et individuelt uttrykk.",
    images: [
      "1347ef_e9e5900cdb4e470e9fce4a366b6dfcae~mv2.jpg", "1347ef_cb160e8c66eb43d7953c70e67cf63163~mv2.jpg",
      "1347ef_cc2109a0146847789db45daf0d95b156~mv2.jpg", "1347ef_a996965adaf5416985ce8d1f45db5210~mv2.jpg",
      "1347ef_d59cfd4a1e90481bb94d6651787721f8~mv2.jpg", "1347ef_b1df18d3f6f245f68b0c3d4976a2fce9~mv2.jpg",
    ].map(media),
  },
  {
    slug: "kjokken-og-flislagte-vegger",
    title: "Kjøkken og flislagte vegger",
    description: "Storformat, mønster og lettstelte overflater tilpasset innredning og belysning.",
    images: [
      "252631_518faa7b93c643bfbfe1ad13a494f05d~mv2.jpg", "1347ef_9d9d4c335dbb43f480a49bac2257461e~mv2.jpg",
      "1347ef_3128d27a52594e10a540f5cdffc1307b~mv2.jpg", "1347ef_373c524ab6464fb183887a0f6877d426~mv2.jpg",
      "1347ef_656f39e0648f41ac925a2727849949cb~mv2.jpg", "1347ef_8d056e5f94684fb2af3e88d52c0a0e8a~mv2.jpg",
      "1347ef_2b5270311249400bb67edcb9290b5eab~mv2.jpg", "1347ef_f93477a92df444e599d6ddeb939fe423~mv2.jpg",
      "1347ef_22785f27a331449d87f0155c7d7ded0e~mv2.jpg",
    ].map(media),
  },
  {
    slug: "trapper",
    title: "Trapper",
    description: "Moderne trappeløp med jevne linjer, robuste kanter og nøyaktig tilpasning.",
    images: [
      "1347ef_d8bcb93e91ec4e598a84ca2827ce5ea3~mv2.jpg", "1347ef_72830365ff6042f3ab41eb63d1cabfb9~mv2.jpg",
      "1347ef_bddfe89d9eeb439a98d8dedb8162c973~mv2.jpg", "1347ef_e02e28c8eec6478f8b7a0aa233913962~mv2.jpg",
      "1347ef_b44c19e9e7c44643b159dce0461dce43~mv2.jpg",
    ].map(media),
  },
  {
    slug: "bad-og-vatrom",
    title: "Bad og våtrom",
    description: "Komplette bad, dusjsoner, nisjer, slukdetaljer og flater i ulike formater.",
    images: [
      "1347ef_44370976117b4d65be4b31b054112b4f~mv2.jpg", "1347ef_1a204b8924a74afd928a4d80ac93c079~mv2.jpg",
      "1347ef_f9bf6125f6a94719a78356bf1bae6016~mv2.jpg", "1347ef_a701e6cbcfb142dd8a0022f3a5fa7b13~mv2.jpg",
      "1347ef_54bc7e24ca6248218bf66c377a5d312b~mv2.jpg", "1347ef_834a7f8010af46e3b6556d66c367aa3d~mv2.jpg",
      "1347ef_f582c25bd29f403d8bf15f7a3415d28e~mv2.jpg", "1347ef_388080b1d1454b85914cc823f62ac892~mv2.jpg",
      "1347ef_d5a9350932904696995442bc2384ed79~mv2.jpg", "1347ef_b11fa91dc2a140439fa7eb27a9ec8d14~mv2.jpg",
      "1347ef_3313dbc8ebdd475b8ddb1d6effe89f30~mv2.jpg", "1347ef_5b8778c745ea4de4b5163d73b9c5218f~mv2.jpg",
      "1347ef_58748140c7604cf19a756b1bcdaab550~mv2.jpg", "1347ef_4ad9908d687c438eb9dd4d9cd90fc67a~mv2.jpg",
      "1347ef_6346669a7a3e4a79b6e10752b22d1c41~mv2.jpg", "1347ef_715ce9cfcb4a4c09aa69f7e929575e07~mv2.jpg",
      "1347ef_1fe77cba31bc446c8d9d1f0b60323bb8~mv2.jpg", "1347ef_3b1a6f06da0c4042a404d2dec10f5a92~mv2.jpg",
      "1347ef_3d314d04c78d491faacb4487ab2a4047~mv2.jpg", "1347ef_f39c1797bbcf48b0828d7e0cbcf45aa8~mv2.jpg",
      "1347ef_2bff289b3bff4fa6b76cd5a612bdfcfc~mv2.jpg", "1347ef_97f88001c72b4309adfd266b4cd47c94~mv2.jpg",
      "1347ef_b9342bb81862420cb177831f27fafea1~mv2.jpg", "1347ef_1a9933e853ed494398aba6c986243081~mv2.jpg",
      "1347ef_12e24304560d42b39c1becad3ddb75b7~mv2.jpg", "1347ef_c6f5ffa5a4564dd8af6c96f2a28ca07d~mv2.jpg",
      "1347ef_ba853a4bbaba4ff5b68d3e7d7f5ce165~mv2.jpg", "1347ef_a12250a4195e44558ca583a81c4bcf0b~mv2.jpg",
    ].map(media),
  },
];

export const portfolioImageCount = portfolioCategories.reduce((sum, category) => sum + category.images.length, 0);

