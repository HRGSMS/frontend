/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx}"],
  theme: {
    extend: {
      // fontFamily: {
      //   poppins: ["Poppins", "sans-serif"],
      // },
      backgroundImage: {
        "footer-bg": "url('images/footer-1.jpg')",
        //   "card-circle": "url('/images/card-circle.png')",
        //   "card-bg-1":
        //     "linear-gradient(147.75deg, #305A04 -0.02%, #3330A5 98.99%)",
        //   "card-bg-2": "linear-gradient(147.75deg, #040404 0%, #5A11C8 100%)",
        //   "card-bg-3": "linear-gradient(180deg, #10B10C 0%, #4FC3F7 100%)",
        //   "card-bg-4": "linear-gradient(135deg, #2C3E50 0%, #4CA1AF 100%)",
        //   "card-bg-5": "linear-gradient(180deg, #22C55E 0%, #10B981 100%)",
        // },
        // boxShadow: {
        //   "city-card": "#00000099 1px 1px 15px",
        //   "city-card-hover": "#00000099 5px 10px 15px",
        //   "city-card-selected": "#00ff1199 0px 4px 15px",
      },
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        body: ["Raleway", "sans-serif"],
      },
    },
  },
  plugins: [],
};
