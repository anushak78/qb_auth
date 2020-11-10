$(document).ready(function () {
  $(".menu-btn").click(function (event) {
    event.preventDefault();
    $("nav").toggleClass("menushow");
  });
});