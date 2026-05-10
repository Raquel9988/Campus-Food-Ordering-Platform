const STANDARD_DIETARY_TAGS = [
  "halal",
  "vegan",
  "vegetarian",
  "nut-free",
  "gluten-free",
];

function cleanDietaryTag(tag) {
  if (typeof tag !== "string") {
    return "";
  }

  return tag.trim().toLowerCase();
}

function isValidDietaryTag(tag) {
  const cleanedTag = cleanDietaryTag(tag);

  return STANDARD_DIETARY_TAGS.includes(cleanedTag);
}

function removeDuplicateDietaryTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }

  const cleanedTags = tags
    .map(cleanDietaryTag)
    .filter((tag) => tag !== "");

  return [...new Set(cleanedTags)];
}

function menuItemHasDietaryInfo(menuItem) {
  return (
    menuItem &&
    Array.isArray(menuItem.dietary_tags) &&
    menuItem.dietary_tags.length > 0
  );
}

function canSaveVendorDietaryTags(tags) {
  const uniqueTags = removeDuplicateDietaryTags(tags);

  if (uniqueTags.length === 0) {
    return false;
  }

  return uniqueTags.every((tag) => isValidDietaryTag(tag));
}

module.exports = {
  cleanDietaryTag,
  isValidDietaryTag,
  removeDuplicateDietaryTags,
  menuItemHasDietaryInfo,
  canSaveVendorDietaryTags,
};