const underscore = function(str) {
  return str.replace(/([A-Z])/g, function($1){return "_"+$1.toLowerCase();});
}

const camelize = function(str) {
  return str.replace(/(\_[a-z])/g, function($1){return $1.toUpperCase().replace('_','');});
}

const decamelize = function(str) {
  return str.replace(/([A-Z])/g, function($1){return $1.replace($1,'_' + $1).toLowerCase();});
}

export { underscore, camelize, decamelize };
