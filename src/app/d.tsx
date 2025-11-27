
declare module "*.css" { // declearning *.css to avoid errors on layout.tsx
  const content: { [className: string]: string };
  export default content;
}
