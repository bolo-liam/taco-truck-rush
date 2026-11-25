// Taco Truck Rush — menu data: ingredients, recipe rules and order generation.
// Every order is tortilla + grilled beef + a random mix of fresh toppings.

const INGREDIENTS = {
  tortilla: { name: 'Tortilla', pay: 2 },
  beef:     { name: 'Grilled beef', pay: 6 },
  tomato:   { name: 'Tomato', pay: 2 },
  onion:    { name: 'Onion', pay: 2 },
  lettuce:  { name: 'Lettuce', pay: 2 },
  cheese:   { name: 'Cheese', pay: 3 },
  salsa:    { name: 'Salsa', pay: 3 },
};

// Toppings that need the chopping board; the rest are instant or grilled.
const CHOP_ITEMS = ['tomato', 'onion', 'lettuce'];
const INSTANT_ITEMS = ['cheese', 'salsa'];

// Build one random order. Early in the shift orders are simple (1 extra
// topping); later they grow to 3 so the player has to plan a route.
function makeOrder(id, elapsedSeconds) {
  const extras = ['tomato', 'onion', 'lettuce', 'cheese', 'salsa'];
  const shuffled = extras.slice().sort(() => Math.random() - 0.5);
  const extraCount = elapsedSeconds < 40 ? 1 : elapsedSeconds < 80 ? 2 : 3;
  const items = ['tortilla', 'beef'].concat(shuffled.slice(0, extraCount));
  const pay = items.reduce((sum, item) => sum + INGREDIENTS[item].pay, 0);
  const patience = Math.max(16, 32 - Math.floor(elapsedSeconds / 30) * 4);
  return { id, items, pay, patience, maxPatience: patience };
}

// Two sets match when they hold exactly the same items, order aside.
function setsMatch(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = a.slice().sort();
  const sortedB = b.slice().sort();
  return sortedA.every((item, i) => item === sortedB[i]);
}
