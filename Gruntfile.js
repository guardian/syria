var fs = require('fs');
var ini = require('ini')
var path = require('path')
var moment = require('moment');

function getAWSCredentials(grunt, cfg) {
    var awsCredentialsFilePath = cfg.credentialsFile.replace('$HOME', process.env['HOME']);
    if (!fs.existsSync(awsCredentialsFilePath)) {
        grunt.log.warn('Credentials file missing: ' + awsCredentialsFilePath);
        return
    }
    var iniFile = ini.parse(fs.readFileSync(awsCredentialsFilePath, 'utf-8'));
    if (iniFile[cfg.profile]) {
        grunt.log.ok('Using AWS credentials ' + cfg.profile + ' profile');
        return iniFile[cfg.profile];
    }

    grunt.log.warn('AWS Credentials profile ' + cfg.profile + ' does not exist. Using default credentials.')
    return iniFile.default;
}

var embeds = ['dashboard', 'past'];

module.exports = function(grunt) {

    require('jit-grunt')(grunt);

    var deploy = require('./deploy.json');
    deploy.versionedPath = path.join(deploy.path, Date.now().toString());
    var awsCredentials = getAWSCredentials(grunt, deploy);

    // dynamically generate various embeds
    var shell = {
        options: {
            execOptions: { cwd: '.' }
        }
    };
    var template = {};

    embeds.forEach(function (embed) {
        shell[embed + 'dev'] = {
            'command': './node_modules/.bin/jspm bundle-sfx src/js/' + embed + ' build/' + embed + '.js'
        };
        shell[embed + 'prod'] = {
            'command': './node_modules/.bin/jspm bundle-sfx -m src/js/' + embed + ' build/' + embed + '.js'
        };

        var files = {};
        var assetPath = deploy.domain + deploy.versionedPath + '/';

        files[embed + '.html'] = ['src/embed.html'];

        template[embed + 'dev'] = {
            'options': { 'data': { 'assetPath': '', 'embed': embed } },
            'files': files
        }
        template[embed + 'prod'] = {
            'options': { 'data': { 'assetPath': assetPath, 'embed': embed } },
            'files': files
        }
    });

    grunt.initConfig({

        visuals: { },

        watch: {
            css: {
                files: ['src/css/**/*'],
                tasks: ['sass'],
            },
            inlinejs: {
                files: ['src/js/**/*', 'src/templates/**/*'],
                tasks: ['jsdev'],
            },
            embed: {
                files: ['src/embed.html'],
                tasks: ['embeddev'],
            },
        },

        clean: {
            build: ['build'].concat(embeds.map(function (embed) { return embed + '.html'; }))
        },

        sass: {
            options: {
                sourceMap: true
            },
            main: {
                files: {
                    'build/main.css': 'src/css/main.scss'
                }
            }
        },

        'shell': shell,
        'template': template,

        'lambda_package': {
            'default': {
                'options': {
                    'package_folder': 'src/data',
                    'dist_folder': 'build',
                    'include_time': false,
                    'include_files': ['../../data-out/dashboard-geo.json']
                }
            }
        },

        aws_s3: {
            options: {
                accessKeyId: awsCredentials.aws_access_key_id,
                secretAccessKey: awsCredentials.aws_secret_access_key,
                region: 'us-east-1',
                uploadConcurrency: 10, // 5 simultaneous uploads
                downloadConcurrency: 10, // 5 simultaneous downloads
                debug: grunt.option('dry'),
                bucket: deploy.bucket,
                differential: true
            },
            inline: {
                files: [
                    {
                        expand: true,
                        cwd: '.',
                        src: embeds.map(function (embed) { return embed + '.html'; }),
                        dest: deploy.path,
                        params: { CacheControl: 'max-age=5' }
                    },
                    {
                        expand: true,
                        cwd: '.',
                        src: [
                            'build/main.css', 'build/main.css.map', 'src/img/*',
                            'data-out/historical/*.png'
                        ].concat(embeds.map(function (embed) { return 'build/' + embed + '.js'; })),
                        dest: deploy.versionedPath,
                        params: { CacheControl: 'max-age=600' }
                    }
                ]
            }
        },

        connect: {
            server: {
                options: {
                    hostname: '0.0.0.0',
                    port: 8000,
                    base: '.',
                    middleware: function (connect, options, middlewares) {
                        // inject a custom middleware http://stackoverflow.com/a/24508523
                        middlewares.unshift(function (req, res, next) {
                            if (req.url === '/') req.url = '/dashboard.html';
                            res.setHeader('Access-Control-Allow-Origin', '*');
                            res.setHeader('Access-Control-Allow-Methods', '*');
                            if (req.originalUrl.indexOf('/jspm_packages/') === 0 ||
                                req.originalUrl.indexOf('/bower_components/') === 0) {
                                res.setHeader('Cache-Control', 'public, max-age=315360000');
                            }
                            return next();
                        });
                        return middlewares;
                    }
                }
            }
        }
    });

    grunt.registerTask('boot_url', function() {
        embeds.forEach(function (embed) {
            grunt.log.write(('\n ' + embed + ': ')['green'].bold)
            grunt.log.writeln(deploy.domain + deploy.path + '/' + embed + '.html');
        });
    })

    grunt.registerTask('jsdev', embeds.map(function (embed) { return 'shell:' + embed + 'dev'; }));
    grunt.registerTask('jsprod', embeds.map(function (embed) { return 'shell:' + embed + 'prod'; }));
    grunt.registerTask('embeddev', embeds.map(function (embed) { return 'template:' + embed + 'dev';}));
    grunt.registerTask('embedprod', embeds.map(function (embed) { return 'template:' + embed + 'prod';}));

    grunt.registerTask('deploy', ['clean', 'sass', 'jsprod', 'embedprod', 'aws_s3:inline', 'boot_url']);
    grunt.registerTask('dev', ['clean', 'sass', 'jsdev', 'embeddev', 'connect', 'watch']);
    grunt.registerTask('devfast', ['clean', 'sass', 'connect', 'watch:css', 'watch:embed']);

    grunt.registerTask('default', ['dev']);

    grunt.loadNpmTasks('grunt-aws');
    grunt.loadNpmTasks('grunt-aws-lambda');

}
