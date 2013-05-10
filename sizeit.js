#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require( 'commander' ),
	uglify = require( 'uglify-js' ),
	zlib = require( 'zlib' ),
	fs = require( 'fs' ),
	md5 = require( 'MD5' );

gzip = zlib.createGzip();

program
  .version( '0.0.1' )
  .usage( '[options] <filepath>' )
  .option( '-c, --compress', 'Show size after compressed.' )
  .option( '-g, --gzip', 'Show size after gzipped.' )
  .parse( process.argv );

var file = program.args[0],
	rFileName = /([^\/]+)$/i,
	outputDir = './output/';

if( !fs.existsSync( outputDir ) ) {
	fs.mkdirSync( outputDir );
}


function calcSize( path, callback ) {
	var stat = fs.statSync( path ),
		rName = rFileName.exec( path ),
		data = {
			filename: rName[ 1 ]
		};

	if( stat.isFile() ) {
		var tmpPath = outputDir + data.filename,
			bakPath = tmpPath + '.bak.js',
			minPath = tmpPath + '.min.js',
			zipPath = tmpPath + '.js.gz',
			minZipPath = tmpPath + '.min.js.gz';

		fs.writeFileSync( bakPath, fs.readFileSync( path ) );

		//original
		var orgStat = fs.statSync( bakPath );
		data.sizeOriginal = orgStat.size;

		if( program.compress ) {
			//compress
			var uglifyCode = uglify.minify( bakPath ).code;

			fs.writeFileSync( minPath, uglifyCode );

			var compressedStat = fs.statSync( minPath );
			data.sizeCompressed = compressedStat.size;
		}

		if( program.gzip ) {
			var inputPath = bakPath;

			if( program.compress ) {
				inputPath = minPath;
			}

			//gzip
			var outputPath = program.compress ? minZipPath : zipPath,
				inp = fs.createReadStream( inputPath ),
				out = fs.createWriteStream( outputPath );

			inp.pipe( gzip )
					.pipe( out )
					.on( 'finish', function(){
						var gzipStat = fs.statSync( outputPath );
						data.sizeGzipped = gzipStat.size;

						callback && callback( data );
					} )
					.on( 'error', function( err ){
						console.log( err );
					} );
		}
	}
}

calcSize( file, function( data ){
	fs.writeFileSync( outputDir + data.filename + '.size.json', JSON.stringify( data, null, 4 ) );
	console.log( 'Done!\nView result in directory ' + '"' + outputDir + '"' );
})
