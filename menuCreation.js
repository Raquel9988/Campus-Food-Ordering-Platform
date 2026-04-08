import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl='https://sqbscxfolbckikrzxqhr.supabase.co';
const supabaseKey='sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay';
const supabase = createClient(supabaseUrl, supabaseKey);

const menuForm=document.getElementById("menu-item-form");
const menuItemsContainer=document.getElementById("menu-items-container");
const submitBtn=document.getElementById("submit-btn");
const cancelEditBtn=document.getElementById("cancel-edit-btn");

//track the item being edited
let editingItemId=null;

//Check user authentication and role
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

//load menu items for the logged-in vendor
async function loadMenuItems(){
    const {data:menuItems,error}=await supabase.from("menu_items").select("*").eq("vendor_id",user.id).order("created_at",{ascending:false});
    if(error){
        console.error("Error fetching menu items:",error);
        menuItemsContainer.innerHTML="<p>Failed to load menu items.</p>";
        return;
    }
    displayMenuItems(menuItems);
}

//display menu items in the UI
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
        ${item.image_url?`<img src="${item.image_url}" alt="${item.name}" width="100">`:""}
        <p><strong>Description:</strong> ${item.description||"No description available."}</p>
        <p><strong>Price:</strong> R${item.price.toFixed(2)}</p>
        <p><strong>Availability:</strong> ${item.is_available?"Available":"Sold Out"}</p>
        <button class="edit-button" data-id="${item.id}">Edit</button>`;
        //Attach Edit Button Event Listener
        const editBtn=itemElement.querySelector(".edit-button");
        editBtn.addEventListener("click",()=>{startEdit(item)});

        menuItemsContainer.appendChild(itemElement);
    });
}

//start editing a menu item
function startEdit(item){
    editingItemId=item.id;
    document.getElementById("item-name").value=item.name;
    document.getElementById("item-description").value=item.description;
    document.getElementById("item-price").value=item.price;
    document.getElementById("item-availability").value=item.is_available;
    submitBtn.textContent="Update Item";
    cancelEditBtn.style.display="block";
}

//cancel editing
cancelEditBtn.addEventListener("click",()=>{
    editingItemId=null;
    menuForm.reset();
    submitBtn.textContent="Add Item";
    cancelEditBtn.style.display="none";
});

//form submit 
menuForm.addEventListener("submit",async function (event){ 
    event.preventDefault();

    const itemName=document.getElementById("item-name").value;
    const itemDescription=document.getElementById("item-description").value;
    const itemPrice=document.getElementById("item-price").value;
    const itemAvailability=document.getElementById("item-availability").value==="true";

    const imageFile=document.getElementById("item-image").files[0];
    let imageUrl=null;

    if(!itemName){
        alert("Please enter the item name.");
        return;
    }
    if(!itemPrice||itemPrice<0){
        alert("Please enter a valid price.");
        return;
    }

    //image upload
    if (imageFile){
        const fileName=`${user.id}_${Date.now()}_${imageFile.name}`;
        const {error:uploadError}=await supabase.storage.from("menu-images").upload(fileName,imageFile);
        if(uploadError){
            console.error("Image upload failed:",uploadError);
            alert("Failed to upload image. Please try again.");
            return;
        }
        const {data}=supabase.storage.from("menu-images").getPublicUrl(fileName);
        imageUrl=data.publicUrl;
    }


    if (editingItemId){
       const updateData={
        name:itemName,
        description:itemDescription,
        price:parseFloat(itemPrice),
        is_available:itemAvailability,
       };
       if (imageUrl){
        updateData.image_url=imageUrl;
       }
       const {error}=await supabase.from("menu_items").update(updateData).eq("id",editingItemId).eq("vendor_id",user.id);

       if(error){
        console.error("Error updating menu item:",error);
        alert("Failed to update menu item. Please try again.");
        return;
       }
       alert("Menu item updated successfully!");
    }
    else{
        const {error}=await supabase.from("menu_items").insert([{
            vendor_id:user.id,
            name:itemName,
            description:itemDescription,
            price:parseFloat(itemPrice),
            is_available:itemAvailability,
            image_url:imageUrl,
        }]);
        if(error){
            console.error("Error adding menu item:",error);
            alert("Failed to add menu item. Please try again.");
            return;
        }
        alert("Menu item added successfully!");
    }
    menuForm.reset();
    await loadMenuItems();
});

//initial load of menu items
loadMenuItems();