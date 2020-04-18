let type = () => {
  let target = document.querySelector(".job");
  let jobText = "Web Developer ~ Bug Hunter".split("");
  target.innerHTML = " ";
  jobText.forEach((element, index) => {
    setTimeout(() => {
      target.innerHTML += element
    }, 500 * (index + 1));

  });
}
type();