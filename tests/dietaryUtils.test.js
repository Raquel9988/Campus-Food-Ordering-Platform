const {
  cleanDietaryTag,
  isValidDietaryTag,
  removeDuplicateDietaryTags,
  menuItemHasDietaryInfo,
  canSaveVendorDietaryTags,
} = require("../dietary/dietaryUtils.js");

test("dietary tag is cleaned by trimming spaces and converting to lowercase", () => {
  expect(cleanDietaryTag(" Halal ")).toBe("halal");
  expect(cleanDietaryTag(" VEGAN ")).toBe("vegan");
});

test("invalid dietary tag type returns an empty string", () => {
  expect(cleanDietaryTag(null)).toBe("");
  expect(cleanDietaryTag(123)).toBe("");
});

test("known dietary tags are valid", () => {
  expect(isValidDietaryTag("halal")).toBe(true);
  expect(isValidDietaryTag("vegan")).toBe(true);
  expect(isValidDietaryTag("vegetarian")).toBe(true);
  expect(isValidDietaryTag("nut-free")).toBe(true);
  expect(isValidDietaryTag("gluten-free")).toBe(true);
});

test("unknown dietary tags are invalid", () => {
  expect(isValidDietaryTag("spicy")).toBe(false);
  expect(isValidDietaryTag("low sugar")).toBe(false);
});

test("duplicate dietary tags are removed", () => {
  const tags = ["halal", "Halal", " vegan ", "vegan"];

  expect(removeDuplicateDietaryTags(tags)).toEqual(["halal", "vegan"]);
});

test("non-array dietary tags return an empty list", () => {
  expect(removeDuplicateDietaryTags(null)).toEqual([]);
  expect(removeDuplicateDietaryTags("halal")).toEqual([]);
});

test("menu item must have dietary information", () => {
  const menuItem = {
    name: "Chicken Burger",
    dietary_tags: ["halal"],
  };

  expect(menuItemHasDietaryInfo(menuItem)).toBe(true);
});

test("menu item without dietary tags has no dietary information", () => {
  const menuItem = {
    name: "Chicken Burger",
    dietary_tags: [],
  };

  expect(menuItemHasDietaryInfo(menuItem)).toBe(false);
});

test("vendor can save valid dietary tags", () => {
  expect(canSaveVendorDietaryTags(["halal", "vegan"])).toBe(true);
});

test("vendor cannot save empty dietary tags", () => {
  expect(canSaveVendorDietaryTags([])).toBe(false);
});

test("vendor cannot save unknown dietary tags", () => {
  expect(canSaveVendorDietaryTags(["halal", "random-tag"])).toBe(false);
});