import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl='https://sqbscxfolbckikrzxqhr.supabase.co';
const supabaseKey='sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay';
const supabase = createClient(supabaseUrl, supabaseKey);

const menuForm=document.getElementById("menu-item-form");

//Temporary Vendor ID fro testing purposes.
const testVendorId="123e4567-e89b-12d3-a456-426614174000";

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
        {  vendor_id: testVendorId,
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
});