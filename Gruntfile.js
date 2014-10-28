module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    watch: {
      scripts: {
        files: ['src/**/*'],
        tasks: ['default'],
        options: {
          spawn: false,
        },
      },
    },
    uglify: {
      my_target: {
        files: {
          'angular-rest-offline.min.js': ['angular-rest-offline.js']
        }
      }
    },
    concat: {
      dist: {
        src: ['src/app.js', 'src/offlineService.js', 'src/offlineSyncupService.js'],
        dest: 'angular-rest-offline.js'
      }
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        browser: true,
        camelcase: true,
        freeze: true,  
        immed: true,
        noempty: true,
        strict: true,
        maxdepth: 2,
        reporter: require('jshint-stylish')
      },
      all: ['src/**/*.js']
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-karma');

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
  grunt.registerTask('test', ['default', 'karma']);
};