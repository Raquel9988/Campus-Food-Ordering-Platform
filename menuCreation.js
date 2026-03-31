const menuForm=document.getElementById("menu-item-form");

menuForm.addEventListener("submit",function (event){ 
    event.preventDefault();
    const itemName=document.getElementById("item-name").value;
    const itemDescription=document.getElementById("item-description").value;
    const itemPrice=document.getElementById("item-price").value;
    const itemImage=document.getElementById("item-image").files[0];
    const itemAvailability=document.getElementById("item-availability").value;

    console.log("Item Name:",itemName);
    console.log("Description:",itemDescription);
    console.log("Price:",itemPrice);
    console.log("Image:",itemImage);
    console.log("Availability:",itemAvailability);

    alert("Form is working. Supabase connection comes next");

});