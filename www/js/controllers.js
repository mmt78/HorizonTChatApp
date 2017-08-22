angular.module('starter.controllers', [])
    .controller('AppController', function ($scope, $state, $ionicHistory, $ionicPlatform, $cordovaToast, $filter, $window, $ionicPopup, $ionicPush, $rootScope, 
                                            AppStorage, UserService, AuthService, AppToken, Socket) {
        var userSettings = UserService.getUserSettings();

        $ionicPlatform.on('pause', function () {
            ionic.Platform.exitApp();
        });
        if(!AuthService.isAuthenticated()) {
            $ionicHistory.clearCache().then(function () {
                $state.go('login');
            });
        } 


        $rootScope.$on('authenticated', function() {
            $scope.user_type = AppStorage.get('user_type');
            if($scope.user_type == 'user') {
                $scope.user = UserService.getUserData();
            } else if($scope.user_type == 'driver') {
                $scope.user = UserService.getDriverData();
            }
        });

        
        $scope.$on('cloud:push:notification', function (event, data) {
            console.log(angular.toJson(data));
            var msg = data.message;
            var infoPopup = $ionicPopup.alert({
                title: msg.title,
                template: msg.text
            });
        });

        $scope.logout = function (type) {
            var token;
            if(type === 'driver') {
                token = AppStorage.get('token');
            } else if(type === 'user') {
                token = AppStorage.get('push_token');
            }
            AuthService.logout(token).then(function (resp) {
                console.log(angular.toJson(resp));
                if (resp.data.result === 'success') {
                    Socket.then(function(Socket) {
                        var data = {
                            id: $scope.user.id,
                            type: $scope.user.type,
                            socket_id: $scope.user.socket_id
                        };
                        Socket.disconnect();
                        ionic.Platform.exitApp();
                        // Socket.emit('logout', data);
                    });
                    if($window.cordova) {
                        $cordovaToast
                            .showWithOptions({
                                message : $filter('translate')('LOGOUT.SUCCESS'),
                                duration: "long", 
                                position: "bottom"
                            })
                            .then(function(success) {                            
                                $ionicHistory.clearCache().then(function () {
                                    $state.go('login');
                                });
                            }, function (error) {
                            // error
                            });
                    } else {
                        var logoutAlert = $ionicPopup.alert({
                            title: $filter('translate')('LOGIN.POPUP_TITLE'),
                            template: $filter('translate')('LOGOUT.SUCCESS')
                        });
                        logoutAlert.then(function() {
                            $ionicHistory.clearCache().then(function () {
                                $state.go('login');
                            });
                        })
                    }
                } else {
                    if($window.cordova) {
                        $cordovaToast
                            .showWithOptions({
                                message : $filter('translate')('LOGOUT.ERROR'),
                                duration: "long", 
                                position: "bottom"
                            })
                            .then(function(success) {                            
                                //success
                            }, function (error) {
                                // error
                            });
                    } else {
                        var logoutAlert = $ionicPopup.alert({
                            title: $filter('translate')('LOGIN.POPUP_TITLE'),
                            template: $filter('translate')('LOGOUT.ERROR')
                        });
                    }
                }
            });
        };
    })
    .controller('LoginController', function ($rootScope, $scope, $state, $filter, $window, $ionicPopup, $ionicHistory, $ionicPush, AppStorage, AppToken, AuthService, UserService) {
        if(AuthService.isAuthenticated()) {
            $state.go('app.list');
        } 
        console.log('Login');
        $scope.doLogin = function (username, password, type) {
            var token = '', access_token = '';
            $scope.loading = true;
            if (!username || !password ||  !type) {
                $scope.loading = false;
                $ionicPopup.alert({
                    title: $filter('translate')('LOGIN.POPUP_TITLE'),
                    template: $filter('translate')('LOGIN.INVALID_INPUTS')
                });
            } else {
                $ionicPush.register().then(function (t) {
                    return $ionicPush.saveToken(t);
                }).then(function (t) {
                    token = t.token;
                    AuthService.login(username, password, token, type).then(function (resp) {
                        
                        $scope.loading = false;
                        if (type === 'user') {
                            var access_token = resp.data.access_token;
                            if (access_token != '') {
                                AuthService.savePushToken(access_token, token).then(function(resp) {
                                    AppStorage.set('username', username);
                                    AppStorage.set('password', password);
                                    AppStorage.set('user_type', type);
                                    AuthService.setToken(access_token);
                                    AppStorage.set('push_token', token);
                                    $ionicHistory.clearCache().then(function () {
                                        $state.go('app.list');
                                    });
                                })
                            } else {
                                $ionicPopup.alert({
                                    title: $filter('translate')('LOGIN.POPUP_TITLE'),
                                    template: $filter('translate')('LOGIN.FAILED')
                                });
                            }
                        } else if (type === 'driver') {
                            if (resp.data.result === 'success' || resp.data.result === 'Previously logged in') {
                                AppStorage.set('username', username);
                                AppStorage.set('password', password);
                                AppStorage.set('user_type', type);
                                AuthService.setToken(token);
                                $ionicHistory.clearCache().then(function () {
                                    $state.go('app.list');
                                });

                            } else {
                                $ionicPopup.alert({
                                    title: $filter('translate')('LOGIN.POPUP_TITLE'),
                                    template: $filter('translate')('LOGIN.FAILED')
                                });
                            }
                        }
                    }, function (resp) {
                        $scope.loading = false;
                        if (resp.status === 401) { // unauthorized
                            $ionicPopup.alert({
                                title: $filter('translate')('LOGIN.POPUP_TITLE'),
                                template: $filter('translate')('LOGIN.FAILED')
                            });
                        }
                    });
                }, function(err) {
                    token = AppToken.token;
                    console.log(token);
                    AuthService.login(username, password, token, type).then(function (resp) {
                        $scope.loading = false;
                        if (type === 'user') {
                            var access_token = resp.data.access_token;
                            if (access_token != '') {
                                AppStorage.set('username', username);
                                AppStorage.set('password', password);
                                AppStorage.set('user_type', type);
                                AppStorage.set('push_token', token);
                                AuthService.setToken(access_token);
                                $ionicHistory.clearCache().then(function () {
                                    $state.go('app.list');
                                });
                            } else {
                                $ionicPopup.alert({
                                    title: $filter('translate')('LOGIN.POPUP_TITLE'),
                                    template: $filter('translate')('LOGIN.FAILED')
                                });
                            }
                        } else if (type === 'driver') {
                            if (resp.data.result === 'success' || resp.data.result === 'Previously logged in') {
                                
                                AppStorage.set('username', username);
                                AppStorage.set('password', password);
                                AppStorage.set('user_type', type);
                                AuthService.setToken(token);

                                $ionicHistory.clearCache().then(function () {
                                    $state.go('app.list');
                                });

                            } else {
                                $ionicPopup.alert({
                                    title: $filter('translate')('LOGIN.POPUP_TITLE'),
                                    template: $filter('translate')('LOGIN.FAILED')
                                });
                            }
                        }
                    }, function (resp) {
                        $scope.loading = false;
                        if (resp.status === 401) { // unauthorized
                            $ionicPopup.alert({
                                title: $filter('translate')('LOGIN.POPUP_TITLE'),
                                template: $filter('translate')('LOGIN.FAILED')
                            });
                        }
                    });
                });
            }
        }
    })
    .controller('ListController', function ($scope, $rootScope, $state, $stateParams, $filter, AuthService, UserService, $ionicPopup, $ionicLoading, 
                                            $ionicHistory, AppStorage, $ionicPush, Socket, $ionicModal, $cordovaToast, $window) {
        if(!AuthService.isAuthenticated()) {
            $state.go('login');
        }
        $scope.user_type = AppStorage.get('user_type');
        if ($scope.user_type === 'driver') {
            console.log(AppStorage.get('token'));
            UserService.getDriverInformation(AppStorage.get('token')).then(function (resp) {
                console.log(angular.toJson(resp.data));
                $scope.driver = {
                    id: resp.data.driver_id, 
                    type: 'driver', 
                    name: resp.data.driver_first_name, 
                    surname: resp.data.driver_last_name,
                    image: resp.data.image, 
                    token: AppStorage.get('token'), 
                    online: '0', 
                    socket_id: '',
                    device_id: resp.data.device_id ? resp.data.device_id : '',
                    device_name: resp.data.name ? resp.data.name : '',
                    device_type: resp.data.type ? resp.data.type : '',
                    device_trip_type: resp.data.trip_type ? resp.data.trip_type : '',
                    device_favorite: resp.data.favorite ? resp.data.favorite : ''
                };
                UserService.saveDriverData($scope.driver);
                $scope.driver.user = {
                    id: resp.data.user_id, 
                    type: 'user', 
                    name: resp.data.user_first_name, 
                    surname: resp.data.user_last_name,
                    image: resp.data.user_image, 
                    token: '', 
                    online: '0', 
                    socket_id: ''
                };
                UserService.saveDriverUserData($scope.driver.user);

                $scope.driver.drivers = [];
                UserService.getDriversList($scope.driver.token, 'driver').then(function(resp) {
                    angular.forEach(resp.data, function (value, key) {
                        $scope.driver.drivers[key] = {
                            id: value.driver_id,
                            name: value.driver_first_name,
                            surname: value.driver_last_name,
                            image: value.image,
                            type: 'driver',
                            token: '',
                            online: '0',
                            socket_id: '',
                            device_id: value.device_id,
                            device_name: value.name,
                            device_type: value.type,
                            device_trip_type: value.trip_type,
                            device_favorite: value.favorite
                        };
                    });
                    UserService.saveDriverDriversData($scope.driver.drivers);
                });
                $rootScope.$broadcast('authenticated');
                Socket.then(function(Socket) {
                    console.log('Socket.then');
                    Socket.on('connect', function () {
                        console.log(this.id);
                        // alert('List: ' + this.id);
                        $scope.driver['online'] = '1';
                        $scope.driver['socket_id'] = this.id;
                        
                        var data = {
                            id: $scope.driver.id,
                            type: 'driver',
                            socket_id: $scope.driver.socket_id
                        };

                        Socket.emit('driver login', data);

                        Socket.emit('user list', { socketId: this.id });

                        Socket.on('update users', function (data) {
                            // alert(angular.toJson(data));
                            if(data.event == undefined) {
                                $scope.driver.user['online'] = '0';
                                $scope.driver.user['socket_id'] = '';
                                angular.forEach(data, function (value, key) {
                                    if (value.id === $scope.driver.user.id) {
                                        $scope.driver.user['online'] = '1';
                                        $scope.driver.user['socket_id'] = value.socket_id;
                                        $rootScope.$broadcast('login', {id: value.id, socketId: value.socket_id});
                                    }
                                });
                            } else {
                                $scope.driver.user['online'] = '0';
                                $scope.driver.user['socket_id'] = '';
                                $rootScope.$broadcast('logout', {id : data.id});
                            }
                        });
                        Socket.emit('driver list', { socketId: this.id });
                            Socket.on('update drivers', function (data) {
                                if(data.event == undefined) {
                                    angular.forEach($scope.user.drivers, function (value, key) {
                                        $scope.user.drivers[key]['online'] = '0';
                                        $scope.user.drivers[key]['socket_id'] = '';
                                    });
                                    angular.forEach(data, function (value, key) {
                                        angular.forEach($scope.user.drivers, function (value1, key1) {
                                            if (value.id === value1.id) {
                                                $scope.user.drivers[key1]['online'] = '1';
                                                $scope.user.drivers[key1]['socket_id'] = value.socket_id;
                                                $rootScope.$broadcast('login', {id : value.id, socketId : value.socket_id});
                                            }
                                        });
                                    });
                                } else {
                                    angular.forEach($scope.user.drivers, function (value, key) {
                                        if (value.id === data.id) {
                                            $scope.user.drivers[key]['online'] = '0';
                                            $scope.user.drivers[key]['socket_id'] = '';
                                        }
                                    });
                                    $rootScope.$broadcast('logout', {id : data.id});
                                }
                            });
                        Socket.on('Message', function (data) {
                            if((data.receiverId == $scope.driver.id) && ($state.current.name=="app.list")) {
                                if($window.cordova) {
                                    $cordovaToast
                                        .showWithOptions({
                                            message : data.sender + '\n' + data.message,
                                            duration: "long", 
                                            position: "top"
                                        })
                                        .then(function(success) {
                                        // success
                                        }, function (error) {
                                        // error
                                        });
                                }
                            }
                        });

                        Socket.on('picture update', function(data) {
                            $scope.driver.user['image'] = data.image;
                        });
                    });

                });
            });
        } else if($scope.user_type === 'user') {
            UserService.getUserInformation(AppStorage.get('token')).then(function (resp) {
                $scope.user = {
                    id: resp.data.user_id, 
                    type: 'user', 
                    name: resp.data.user_first_name, 
                    surname: resp.data.user_last_name,
                    image: resp.data.image, 
                    token: AppStorage.get('token'), 
                    pushToken:  AppStorage.get('push_token'),
                    online: '0', 
                    socket_id: ''
                };
                UserService.saveUserData($scope.user);
                $scope.user.drivers = [];
                UserService.getDriversList(AppStorage.get('token'), 'user').then(function (resp) {
                    angular.forEach(resp.data, function (value, key) {
                        $scope.user.drivers[key] = {
                            id: value.driver_id,
                            name: value.driver_first_name,
                            surname: value.driver_last_name,
                            image: value.image,
                            type: 'driver',
                            token: '',
                            online: '0',
                            socket_id: '',
                            device_id: value.device_id,
                            device_name: value.name,
                            device_type: value.type,
                            device_trip_type: value.trip_type,
                            device_favorite: value.favorite
                        };
                    });
                    UserService.saveUserDriversData($scope.user.drivers);
                    $rootScope.$broadcast('authenticated');
                    Socket.then(function(Socket) {
                        console.log('Socket.then');
                        Socket.on('connect', function () {
                            console.log(this.id);
                            $scope.user['online'] = '1';
                            $scope.user['socket_id'] = this.id;

                            var data = {
                                id: $scope.user.id,
                                socket_id: $scope.user.socket_id,
                                type: 'user'
                            };
                            Socket.emit('user login', data);

                            Socket.on('update users', function(data) {

                            });
                            Socket.emit('driver list', { socketId: this.id });
                            Socket.on('update drivers', function (data) {
                                if(data.event == undefined) {
                                    angular.forEach($scope.user.drivers, function (value, key) {
                                        $scope.user.drivers[key]['online'] = '0';
                                        $scope.user.drivers[key]['socket_id'] = '';
                                    });
                                    angular.forEach(data, function (value, key) {
                                        angular.forEach($scope.user.drivers, function (value1, key1) {
                                            if (value.id === value1.id) {
                                                $scope.user.drivers[key1]['online'] = '1';
                                                $scope.user.drivers[key1]['socket_id'] = value.socket_id;
                                                $rootScope.$broadcast('login', {id : value.id, socketId : value.socket_id});
                                            }
                                        });
                                    });
                                } else {
                                    angular.forEach($scope.user.drivers, function (value, key) {
                                        if (value.id === data.id) {
                                            $scope.user.drivers[key]['online'] = '0';
                                            $scope.user.drivers[key]['socket_id'] = '';
                                        }
                                    });
                                    $rootScope.$broadcast('logout', {id : data.id});
                                }
                            });
                            Socket.on('update trip', function(device_data) {
                                angular.forEach($scope.user.drivers, function (value, key) {
                                    if (value.id === device_data.id) {
                                        console.log(device_data);
                                        $scope.user.drivers[key]['device_id'] = device_data.device_id;
                                        $scope.user.drivers[key]['device_name'] = device_data.device_name;
                                        $scope.user.drivers[key]['device_type'] = device_data.device_type;
                                        $scope.user.drivers[key]['device_trip_type'] = device_data.device_trip_type;
                                        $scope.user.drivers[key]['device_favorite'] = device_data.device_favorite;
                                    }
                                });
                            });
                            Socket.on('picture update', function(data) {
                                angular.forEach($scope.user.drivers, function (value, key) {
                                    if (value.id === data.id) {
                                        $scope.user.drivers[key]['image'] = data.image;
                                    }
                                });
                            });
                            Socket.on('Message', function (data) {
                                if(data.receiverId == $scope.user.id) {
                                    if($window.cordova) {
                                        $cordovaToast
                                            .showWithOptions({
                                                message : data.sender + '\n' + data.message,
                                                duration: "long", 
                                                position: "top"
                                            })
                                            .then(function(success) {
                                            // success
                                            }, function (error) {
                                            // error
                                            });
                                    }
                                }
                            });
                        });

                    });
                });
            });
        }
        $scope.chat = function (user) {
            $ionicHistory.clearCache().then(function () {
                $state.go('app.chat', { data : user });
            });
        };
    })
    .controller('ChatController', function ($rootScope, $scope, $state, $window, $ionicScrollDelegate, $timeout, $filter, $cordovaMedia, $cordovaToast,
                                            Socket, UserService, AppStorage, MessageService, moment, AuthService) {
        
        if(!AuthService.isAuthenticated()) {
            $state.go('login');
        }
        $scope.user_type = AppStorage.get('user_type');
        
        $scope.receiver = $state.params.data;

        if($scope.user_type === 'driver') {
            $scope.sender = UserService.getDriverData();
        } else if($scope.user_type === 'user') {
            $scope.sender = UserService.getUserData();
        }

        // console.log(angular.toJson($scope.sender), angular.toJson($scope.receiver));

        // $scope.displayPicture = $scope.sender.image ? 'https://www.profi-ortung.de/assets/uploads/' + $scope.sender.type + 's/' + $scope.sender.image : 'img/dummy_icon.png';
        $scope.status_message = '';
        $scope.messages = [];

        $scope.senderName = $scope.sender.name + ' ' + $scope.sender.surname;
        $scope.receiverName = $scope.receiver.name + ' ' + $scope.receiver.surname;
        $scope.senderSocketId = $scope.sender.socket_id;
        $scope.receiverSocketId = $scope.receiver.socket_id;
        $scope.senderId = $scope.sender.id;
        $scope.receiverId = $scope.receiver.id;

        $rootScope.$on('logout', function(event, args) {
            // alert('logout' + angular.toJson(args));
            if($scope.receiverId == args.id) {
                $scope.receiverSocketId = '';
            }
        });
        $rootScope.$on('login', function(event, args) {
            // alert('login' + angular.toJson(args));
            if($scope.receiverId == args.id) {
                $scope.receiverSocketId = args.socketId;
            }
        });

        MessageService.getMsgs({ senderId: $scope.senderId,  receiverId : $scope.receiverId }).then(function(resp) {
            if(resp.statusText == 'OK') {
                angular.forEach(resp.data, function(value, key) {
                    $scope.messages[key] = {
                        id: value.id,
                        receiverId : value.to_id,
                        senderId : value.from_id,
                        message : value.reply,
                        displayPicture : $scope.displayPicture,
                        timestamp : value.timestamp,
                        messageType : value.con_id,
                        isRead: value.is_read,
                        readTime: value.read_time
                    }
                    if($scope.senderId == value.to_id && value.is_read == 0) {
                        var readTime = (new Date()).getTime();
                        MessageService.readMsg(value.id, 1, readTime).then(function(resp) {
                            // console.log(angular.toJson(resp));
                            Socket.then(function(Socket) {
                                Socket.emit('message read', { id: value.id, receiverId: value.to_id, senderId: value.from_id, isRead : 1, readTime: readTime });
                            });
                        });
                    }
                });
                $ionicScrollDelegate.$getByHandle('mainScroll').scrollBottom(true);
            }
        });
        Socket.then(function(Socket) {
            Socket.on('Message', function (data) {
                console.log(angular.toJson(data));
                // if($window.cordova) {
                    if($scope.receiverId == data.senderId || $scope.senderId == data.senderId) {
                        // $ionicScrollDelegate.$getByHandle('mainScroll').scrollBottom(true);
                        $scope.messages.push(data);
                        if ($scope.senderSocketId === data.receiverSocketId) {
                            playAudio("audio/outgoing.mp3");
                            var readTime = (new Date()).getTime();
                            MessageService.readMsg(data.id, 1, readTime).then(function(resp) {
                                Socket.emit('message read', { id: data.id, receiverId: data.receiverId, senderId: data.senderId, isRead : 1, readTime: readTime });
                            });
                        } else {
                            // var readTime = (new Date()).getTime();
                            playAudio('audio/incoming.mp3');
                        }
                    } else {
                        if($window.cordova) {
                            $cordovaToast
                                .showWithOptions({
                                    message : data.sender + '\n' + data.message,
                                    duration: "long", 
                                    position: "top"
                                })
                                .then(function(success) {
                                // success
                                }, function (error) {
                                // error
                                });
                        } else {
                            console.log(data.sender + ' ' + data.message);
                        }
                    }
                    $ionicScrollDelegate.$getByHandle('mainScroll').scrollBottom(true);
                // }
            });
            Socket.on('message update', function(data) {
                if($scope.senderId == data.senderId) {
                    angular.forEach($scope.messages, function(msg, key) {
                        if(msg.id == data.id) {
                            $scope.messages[key]['isRead'] = data.isRead;
                            $scope.messages[key]['readTime'] = data.readTime;
                            console.log(angular.toJson($scope.messages[key]));
                        }
                    });
                }
            });
        });

        var typing = false;
        var TYPING_TIMER_LENGTH = 2000;

        $scope.updateTyping = function () {
            if (!typing) {
                typing = true;
                Socket.then(function(Socket) {
                    Socket.emit("typing", { receiverSocketId: $scope.receiverSocketId, sender: $scope.senderName });
                });
            }
            lastTypingTime = (new Date()).getTime();

            $timeout(function () {
                var timeDiff = (new Date()).getTime() - lastTypingTime;
                if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                    Socket.then(function(Socket) {
                        Socket.emit('stop typing', { receiverSocketId: $scope.receiverSocketId, sender: $scope.senderName });
                    });
                    typing = false;
                }
            }, TYPING_TIMER_LENGTH);
        };
        Socket.then(function(Socket) {
            Socket.on('stop typing', function (data) {
                $scope.status_message = "";
            });

            Socket.on('typing', function (data) {
                $scope.status_message = data.sender + $filter('translate')('CHAT.IS_TYPING');
            });
        });
        var playAudio = function (src) {
            // if (ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
            if ($window.cordova) {
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
            if ($scope.message.length === 0) {
                return;
            }
            var newMessage = {};
            newMessage.receiver = [];
            newMessage.sender = $scope.senderName;
            newMessage.message = $scope.message;
            newMessage.messageType = $scope.messageType  ? $scope.messageType : 0;
            newMessage.receiverSocketId = $scope.receiverSocketId;
            newMessage.receiverId = $scope.receiverId;
            newMessage.senderSocketId = $scope.senderSocketId;
            newMessage.senderId = $scope.senderId;
            newMessage.displayPicture = $scope.displayPicture;
            newMessage.timestamp = (new Date()).getTime();
            newMessage.isRead = 0;
            newMessage.readTime = null;
                UserService.getPushToken($scope.receiverId, $scope.receiver.type).then(function(resp) {
                    if($scope.receiverSocketId ==  '') {
                        newMessage.pushToken = resp.data.token ? resp.data.token : ''; 
                        newMessage.receiver.push($scope.receiver);
                    }
                    MessageService.saveMsgs(newMessage).then(function(resp) {
                        newMessage.id = resp.data.insert_id;
                        Socket.then(function(Socket) {
                            Socket.emit('Message', newMessage);
                        })
                    }, function(err) {
                        console.log(err);
                        $cordovaToast
                            .showWithOptions({
                                message : $filter('translate')('CHAT.CHAT_NOT_DELIVERED'),
                                duration: "long", 
                                position: "bottom"
                            })
                            .then(function(success) {                            
                                //success
                            }, function (error) {
                                // error
                            });
                    });
                    $scope.message = '';
                }, function(err) {
                    newMessage.pushToken = '';
                });
            } 
        $scope.quickReply = function(reply) {
            $scope.message = $filter('translate')(reply);
            $scope.messageType = 1;
            $scope.sendMessage();
        }
    })
    .controller('SettingsController', function ($scope, $http, $window, $cordovaCamera, $filter, $cordovaFile, $cordovaFileTransfer, $cordovaToast, 
                                                $ionicLoading, $ionicPopup, AppStorage, UserService, Socket, AuthService) {
        if(!AuthService.isAuthenticated()) {
            $state.go('login');
        }
        $scope.user_type = AppStorage.get('user_type');
        $scope.language = UserService.getUserSetting('language');
        if($scope.user_type == 'user') {
            $scope.user = UserService.getUserData();
        } else {
            $scope.user = UserService.getDriverData();
        }
        
        $scope.showAlert = function (title, msg) {
            $ionicPopup.alert({
                title: title,
                template: msg
            });
        };
        $scope.picUpload = function () {
            // var sourcePath = 'file:///sdcard/Android/data/com.ionicframework.antessahatakip/cache/';
            // var destPath = 'file:///sdcard/Android/data/com.ionicframework.antessahatakip/files/';
            var fileName;
            var options = {
                quality: 50,
                destinationType: Camera.DestinationType.FILE_URI,
                sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: 128,
                targetHeight: 128,
                saveToPhotoAlbum: false
            };
            $cordovaCamera.getPicture(options).then(function (imageData) {
                $ionicLoading.show({
                    template: 'Yükleniyor',
                    noBackDrop: true,
                    hideOnStateChange: true
                });
                imageData = imageData.split('?')[0];
                var currentName = imageData.replace(/^.*[\\\/]/, '');
                var d = new Date(),
                    n = d.getTime(),
                    newFileName = $scope.user.type + '_' + n + ".jpg";
                var namePath = imageData.substr(0, imageData.lastIndexOf('/') + 1);
                var targetPath = namePath + currentName;

                var options = {
                    fileKey: "file",
                    fileName: newFileName,
                    chunkedMode: false,
                    mimeType: "multipart/form-data",
                    params: { 'fileName': newFileName, 'type': $scope.user.type }
                };
                
                $cordovaFileTransfer.upload('https://www.profi-ortung.de/upload.php', targetPath, options).then(function (result) {
                    $ionicLoading.hide();
                    if (result.responseCode == 200) {
                        UserService.uploadProfilePic($scope.user.type, $scope.user.token, newFileName).then(function(resp) {
                            // $scope.showAlert('Upload Res', angular.toJson(resp));
                            if(resp.data.result == 'success') {
                                $scope.user.image = resp.data.image;
                                var pic_data = {
                                    id: $scope.user.id,
                                    type: $scope.user.type,
                                    image: $scope.user.image
                                }
                                Socket.then(function(Socket) {
                                    Socket.emit('picture upload', pic_data);
                                });
                                if($window.cordova) {
                                    $cordovaToast
                                        .showWithOptions({
                                            message : $filter('translate')('MENU.PROFILE_PICTURE_SUCCESS'),
                                            duration: "long", 
                                            position: "bottom"
                                        })
                                        .then(function(success) {                            
                                            //success
                                        }, function (error) {
                                            // error
                                        });
                                } else {
                                    var logoutAlert = $ionicPopup.alert({
                                        title: $filter('translate')('LOGIN.POPUP_TITLE'),
                                        template: $filter('translate')('MENU.PROFILE_PICTURE_SUCCESS')
                                    });
                                }
                            } else {
                                if($window.cordova) {
                                    $cordovaToast
                                        .showWithOptions({
                                            message : $filter('translate')('MENU.PROFILE_PICTURE_ERROR'),
                                            duration: "long", 
                                            position: "bottom"
                                        })
                                        .then(function(success) {                            
                                            //success
                                        }, function (error) {
                                            // error
                                        });
                                } else {
                                    var logoutAlert = $ionicPopup.alert({
                                        title: $filter('translate')('LOGIN.POPUP_TITLE'),
                                        template: $filter('translate')('MENU.PROFILE_PICTURE_ERROR')
                                    });
                                }
                            }
                        });
                        // $scope.showAlert('Başarılı', 'Fotoğraf başarıyla yüklendi.');
                    } else {
                        $scope.showAlert('Başarısız', 'Fotoğraf yükleme başarısız!');
                    }
                }, function(err) {
                    $ionicLoading.hide();
                    $scope.showAlert('Upload Error', angular.toJson(err));
                });
            }, function (err) {
                // $ionicLoading.hide();
                $scope.showAlert('Kamera Hatası', angular.toJson(err));
            });
        }
    })
    .controller('DevicesController', function ($scope, $http, $ionicHistory, $state, UserService, AppStorage, Socket, $ionicLoading) {
        $scope.user_type = AppStorage.get('user_type');
        if($scope.user_type == 'user') {
            $scope.user = UserService.getUserData();
        } else if($scope.user_type == 'driver') {
            $scope.user = UserService.getDriverData();
        }
        $scope.devices = [];
        $ionicLoading.show({
            template: 'Yükleniyor',
            noBackDrop: true,
            hideOnStateChange: true
        });
        UserService.getVehicleIcons($scope.user.token, $scope.user_type).then(function (resp) {
            $ionicLoading.hide();
            $scope.devices = resp.data;
            console.log(angular.toJson(resp));
        });
    })
    .controller('DeviceController', function($scope, $state, $window, $ionicPopup, $ionicHistory, $filter, $cordovaToast, AppStorage, UserService) {
        $scope.user_type = AppStorage.get('user_type');
        if($scope.user_type == 'driver') {
            $scope.user = UserService.getDriverData();
        } else if($scope.user_type == 'user') {
            $scope.user = UserService.getDriverData();
        }
        
        $scope.deviceId = $state.params.deviceId;
        $scope.hideStatus = $state.params.hideStatus;
        $scope.deviceName = $state.params.deviceName;
        $scope.tripType = $state.params.tripType;
        
        $scope.setTripType = function(device_id, trip_type) {
            var tripData = {
                token       :   AppStorage.get('token'),
                device_id   :   device_id,
                trip_type   :   trip_type
            }
            UserService.setTripType(tripData).then(function(resp) {
                if(resp.data.result == 'success') {
                    $scope.user['device_id'] = resp.data.device_id;
                    $scope.user['device_name'] = resp.data.name;
                    $scope.user['device_type'] = resp.data.type;
                    $scope.user['device_trip_type'] = resp.data.trip_type;
                    $scope.user['device_favorite'] = 1;
                    if($window.cordova) {
                        $cordovaToast
                            .showWithOptions({
                                message : $filter('translate')('DEVICE.DEVICE_TYPE_SUCCESS'),
                                duration: "long", 
                                position: "bottom"
                            })
                            .then(function(success) {                            
                                $ionicHistory.clearCache().then(function () {
                                    $ionicHistory.goBack();
                                });
                            }, function (error) {
                            // error
                            });
                    } else {
                        var tripTypeAlert = $ionicPopup.alert({
                            title: $filter('translate')('LOGIN.POPUP_TITLE'),
                            template: $filter('translate')('DEVICE.DEVICE_TYPE_SUCCESS')
                        });
                        tripTypeAlert.then(function() {
                            $ionicHistory.clearCache().then(function () {
                                $ionicHistory.goBack();
                            });
                        })
                    }
                }
            });
        }

        $scope.hideShowDevice = function(device_id) {
            UserService.hideShowDevice(device_id).then(function(resp) {
                if(resp.data.result == 'success') {
                    if($window.cordova) {
                        $cordovaToast
                            .showWithOptions({
                                message : $filter('translate')('DEVICE.DEVICE_STATUS_SUCCESS'),
                                duration: "long", 
                                position: "bottom"
                            })
                            .then(function(success) {                            
                                $ionicHistory.clearCache().then(function () {
                                    $ionicHistory.goBack();
                                });
                            }, function (error) {
                            // error
                            });
                    } else {
                        var tripTypeAlert = $ionicPopup.alert({
                            title: $filter('translate')('LOGIN.POPUP_TITLE'),
                            template: $filter('translate')('DEVICE.DEVICE_STATUS_SUCCESS')
                        });
                        tripTypeAlert.then(function() {
                            $ionicHistory.clearCache().then(function () {
                                $ionicHistory.goBack();
                            });
                        })
                    }
                }
            });
        }
    })
    .controller('LanguageController', function($scope, $rootScope, $ionicLoading, $filter, $ionicHistory, $translate, $ionicPopup, AppStorage, UserService) {

        $scope.language = UserService.getUserSetting('language');

        $scope.changeLanguage = function (language) {
            $ionicLoading.show({
                template: $filter('translate')('PLEASE_WAIT')
            });

            UserService.setUserSetting('language', language);
            $ionicHistory.clearCache().then(function () {
                $translate.use(language).then(function (data) {
                    $ionicLoading.hide()
                    $ionicHistory.goBack();
                }, function(err) {
                    console.log(err);
                });
            });
        };
    })
    .controller('PrivacyController', function($scope) {

    });

