var fs = require('fs');
var execSync = require('child_process').execSync;

module.exports = function(moduleName) {
	var moduleExists = ['.', '..'].some(function(e) {
		return fs.existsSync(e + '/node_modules/' + moduleName);
	});
	if (!moduleExists) {
		console.log('Module ' + moduleName ' not installed. Installing...');
		try {
			execSync('npm install ' + moduleName);
		} catch (e) {
			console.log('Failed. Run "npm install ' + moduleName + '" and try again');
			process.exit(1);
		}
	}
	return require(moduleName);
};