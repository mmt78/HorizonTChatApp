// Ionic Starter App
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'btford.socket-io', 'ngCordova', 'ngCordovaOauth', 'ionic.cloud', 'pascalprecht.translate'])
        .run(function ($ionicPlatform, $translate) {
            $ionicPlatform.ready(function () {
                if (window.cordova && window.cordova.plugins.Keyboard) {
                    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                    // for form inputs)
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

                    // Don't remove this line unless you know what you are doing. It stops the viewport
                    // from snapping when text inputs are focused. Ionic handles this internally for
                    // a much nicer keyboard experience.
                    cordova.plugins.Keyboard.disableScroll(true);
                }
                if (window.StatusBar) {
                    StatusBar.styleDefault();
                }
            });
//            $translate.use($rootScope.userSettings.language);
            $translate.use('en');
        })
        .factory('Socket', function (socketFactory) {
            var myIoSocket = io.connect('https://ionic-chat-mmtopcu.c9users.io');
            mySocket = socketFactory({
                ioSocket: myIoSocket
            });
            return mySocket;
        })
        .directive('ngEnter', function () {
            return function (scope, element, attrs) {
                element.bind("keydown keypress", function (event) {
                    if (event.which === 13) {
                        scope.$apply(function () {
                            scope.$eval(attrs.ngEnter);
                        });
                        event.preventDefault();
                    }
                })
            }
        })
        .config(function ($stateProvider, $urlRouterProvider, $ionicCloudProvider, $translateProvider, $httpProvider) {
            $stateProvider
                    .state('login', {
                        url: '/login',
                        templateUrl: 'templates/login.html'
                    })

                    .state('chat', {
                        url: '/chat',
                        params: {data: null},
                        templateUrl: 'templates/chat.html'
                    });

            $urlRouterProvider.otherwise('/login');

            $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

            /* Language settings
             */
            $translateProvider.useStaticFilesLoader({
                prefix: 'lang/',
                suffix: '.json'
            });
            $translateProvider.useSanitizeValueStrategy(null);
            //$translateProvider.preferredLanguage('en');
            $ionicCloudProvider.init({
                "core": {
                    "app_id": "991da184"
                },
                "push" : {
                  "sender_id" : "920491936402",
                  "pluginConfig" : {
                    "ios" : {
                      "badge" : true,
                      "sound" : true
                    },
                    "android" : {
                      "iconColor" : "#343434"
                    }
                  }
                }
            });
        })
        /* Constant Values */
        .constant('AppToken', {
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhZjZjMjU5YS02OGNjLTQyMmQtYmMzZi1iYTg3MGE1YzYzOTMifQ.69UBfv_Qq3F4XrZ2YJOB-gh2EWuKdh8ImdzRkIfIY00'
        })
        .constant('AppConfig', {
            apiUrl: 'http://93.93.252.174/api/v1'
        })
        // localStorage
        .constant('AppStorage', BoomerangCache.create('horizont'))
        .controller('LoginController', function ($scope, $state, $cordovaOauth, $http) {
            $scope.join = function (nickname) {
                if (nickname) {
                    $state.go('chat', {data: {nickname: nickname, displayPicture: 'http://www.smartcallcentersolutions.com/images/profile_icon.png'}});
                }
            }
            $scope.user = {};
            $scope.loginWithFacebook = function () {
                $cordovaOauth.facebook("306899913099889", ["email"]).then(function (result) {
//            alert(result.access_token);
                    $http.get('https://graph.facebook.com/v2.9/me?fields=id,name,picture&access_token=' + result.access_token).success(function (data, status, header, config) {
                        $scope.user.fullName = data.name;
                        $scope.user.displayPicture = data.picture.data.url;
//                alert(angular.toJson($scope.user));
                        $state.go('chat', {data: {nickname: $scope.user.fullName, displayPicture: $scope.user.displayPicture}});
                    });
                }, function (error) {
                    // error
                    alert(error);
                });
            }
        })

        .controller('ChatController', function ($scope, $stateParams, Socket, $ionicScrollDelegate, $cordovaMedia, $timeout) {
            $scope.displayPicture = $stateParams.data.displayPicture;
            $scope.status_message = 'Welcome to ChatApp';
            $scope.messages = [];
            $scope.nickname = $stateParams.data.nickname;


            Socket.on('connect', function () {
                $scope.socketId = this.id;
                var data = {
                    message: $scope.nickname + " has joined the chat!",
                    sender: $scope.nickname,
                    socketId: $scope.socketId,
                    displayPicture: "",
                    isLog: true
                };
                Socket.emit('Message', data);

            });

            Socket.on('Message', function (data) {
                $scope.messages.push(data);
                if ($scope.socketId == data.socketId) {
                    playAudio("audio/outgoing.mp3");
                } else {
                    playAudio('audio/incoming.mp3');
                }
                $ionicScrollDelegate.$getByHandle('mainScroll').scrollBottom(true);
            })

            var typing = false;
            var TYPING_TIMER_LENGTH = 2000;

            $scope.updateTyping = function () {
                if (!typing) {
                    typing = true;
                    Socket.emit("typing", {socketId: $scope.socketId, sender: $scope.nickname});
                }
                lastTypingTime = (new Date()).getTime();

                $timeout(function () {
                    var timeDiff = (new Date()).getTime() - lastTypingTime;
                    if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                        Socket.emit('stop typing', {socketId: $scope.socketId, sender: $scope.nickname});
                        typing = false;
                    }
                }, TYPING_TIMER_LENGTH);
            };

            Socket.on('stop typing', function (data) {
                $scope.status_message = "Welcome to ChatApp";
            });

            Socket.on('typing', function (data) {
                $scope.status_message = data.sender + ' is typing...';
            })

            var playAudio = function (src) {
                if (ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
                    var newUrl = '';
                    if (ionic.Platform.isAndroid()) {
                        newUrl = "/android_asset/www/" + src;
                    } else {
                        newUrl = src;
                    }
                    var media = new Media(newUrl, null, null, null);
                    media.play();
                } else {
                    new Audio(src).play();
                }
            }

            $scope.sendMessage = function () {
                if ($scope.message.length == 0) {
                    return;
                }
                var newMessage = {sender: '', message: '', socketId: '', isLog: false};
                newMessage.sender = $scope.nickname;
                newMessage.message = $scope.message;
                newMessage.socketId = $scope.socketId;
                newMessage.isLog = false;
                newMessage.displayPicture = $scope.displayPicture;
                Socket.emit('Message', newMessage);
                $scope.message = '';
            }
        })
        ;
