export const siteConfig = {
  name: 'Blogfolio',
  description: 'A considered collection of personal websites, creative spaces, and independent corners of the web.',
  url: import.meta.env.SITE || 'https://blogfolio.example',
  email: 'contact@itkdm.com',
  recommendationFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSejsfSm7gSQjzv9mrFdp0PU-BtvM8BhdHVHixyUQQnPOi0NBA/viewform',
  categories: ['minimal','developer','design','indie-maker','writing','photography','lifestyle'].map((slug) => ({ slug })),
};
