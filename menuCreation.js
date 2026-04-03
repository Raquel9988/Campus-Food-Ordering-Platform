import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl='https://sqbscxfolbckikrzxqhr.supabase.co';
const supabaseKey='sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay';
const supabase = createClient(supabaseUrl, supabaseKey);

const menuForm=document.getElementById("menu-item-form");
const menuItemsContainer=document.getElementById("menu-items-container");

const {data:{user},error:userError}=await supabase.auth.getUser();
if(userError||!user){
    alert("Error fetching user data. Please log in again.");
    window.location.href="login.html";
    throw new Error("User not authenticated");
}
const{data:users,error:roleError}=await supabase.from("users").select("role").eq("id",user.id);
if(roleError||!users||users.length===0){
    alert("Error fetching user role. Please log in again.");
    window.location.href="login.html";
    throw new Error("User role not found");
}
if(users[0].role!=="vendor"){
    alert("Access denied. Only vendors can access this page.");
    window.location.href="login.html";
    throw new Error("User is not a vendor");
}

/* Used for Testing purposes only
const testUserId="123e4567-e89b-12d3-a456-426614174000";
*/

async function loadMenuItems(){
    const {data:menuItems,error}=await supabase.from("menu_items").select("*").eq("vendor_id",user.id).order("created_at",{ascending:false});
    if(error){
        console.error("Error fetching menu items:",error);
        menuItemsContainer.innerHTML="<p>Failed to load menu items.</p>";
        return;
    }
    displayMenuItems(menuItems);
}
function displayMenuItems(items){
    if(!items||items.length===0){
        menuItemsContainer.innerHTML="<p>No menu items found. Please add some!</p>";
        return;
    }
    menuItemsContainer.innerHTML="";
    items.forEach((item)=>{
        const itemElement=document.createElement("div");
        itemElement.classList.add("menu-item-element");
        itemElement.innerHTML=`<h3><u>${item.name}</u></h3>
        <p><strong>Description:</strong> ${item.description||"No description available."}</p>
        <p><strong>Price:</strong> R${item.price.toFixed(2)}</p>
        <p><strong>Availability:</strong> ${item.is_available?"Available":"Sold Out"}</p>`;
        menuItemsContainer.appendChild(itemElement);
    });
}

menuForm.addEventListener("submit",async function (event){ 
    event.preventDefault();

    const itemName=document.getElementById("item-name").value;
    const itemDescription=document.getElementById("item-description").value;
    const itemPrice=document.getElementById("item-price").value;
    const itemAvailability=document.getElementById("item-availability").value==="true";

    if(!itemName){
        alert("Please enter the item name.");
        return;
    }
    if(!itemPrice||itemPrice<0){
        alert("Please enter a valid price.");
        return;
    }
    const {error}=await supabase.from("menu_items").insert([
        {  vendor_id: user.id,
            name: itemName,
            description: itemDescription,
            price: parseFloat(itemPrice),
            is_available: itemAvailability,
        }
    ]);
    if(error){
        console.error("Error adding menu item:",error);
        alert("Failed to add menu item. Please try again.");
        return;
    }
    alert("Menu item added successfully!");
    menuForm.reset();
    await loadMenuItems();
});
loadMenuItems();