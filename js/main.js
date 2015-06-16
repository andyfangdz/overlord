if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

var checked_task = Hogan.compile('<article data-id={{id}}>' +
    '<h3><i class="fa fa-check-circle-o green"></i> {{id}}. {{title}}</h3>' +
    '<p>{{{content}}}</p>' +
    '</article>');

var next_task = Hogan.compile('<article data-id={{id}}>' +
    '<h3><i class="fa fa-check-circle-o gray"></i> {{id}}. {{title}}</h3>' +
    '<p>{{{content}}}</p>' +
    '</article>');

var future_task = Hogan.compile('<article class="grey-out" data-id={{id}}>' +
    '<h3><i class="fa fa-check-circle-o gray "></i> {{id}}. {{title}}</h3>' +
    '<p>{{{content}}}</p>' +
    '</article>');

var error_task = Hogan.compile('<article data-id={{id}}>' +
    '<h3><i class="fa fa-times red"></i> {{id}}. {{title}}</h3>' +
    '<p>{{{content}}}</p>' +
    '</article>');

var taskTypeDispatcher = {
    'checked': checked_task,
    'next': next_task,
    'future': future_task,
    'error': error_task
}


function loadStage(stage) {
    return new Promise(function(resolve, reject) {
        stuff('secure/index.html', document.getElementById("preview"), function(context) {
            window.ctxx = context;
            var files = {};
            var compiled_template = Hogan.compile(stage.template);
            var t = null;
            var currentId = 0;

            function reload() {
                clearTimeout(t);
                t = setTimeout(function() {
                    var ctx = {};
                    for (var file in files) {
                        ctx[file] = files[file].getValue();
                    }
                    var code = compiled_template.render(ctx);
                    context.load(code);
                }, 50);
            }

            function renderTaskList() {
                $('#tasks').empty();
                for (var i = 0; i < stage.tasks.length; i++) {
                    if (stage.tasks[i].state != null) {
                        $('#tasks').append(taskTypeDispatcher[stage.tasks[i].state].render(stage.tasks[i]));
                    }
                }
            }

            function checkNthTask(n) {
                return new Promise(function(resolve, reject) {
                    try {
                        context.evaljs(stage.tasks[n].checker, function(error, result) {
                            if (error) {
                                reject(error);
                            }
                            resolve(result);
                        })
                    } catch (e) {
                        resolve(false);
                    };
                });
            }

            function checkTaskState() {
                var flagNext = false;
                var flagFuture = false;
                var flagOnce = false;
                var i = 0;
                return stage.tasks.reduce(function(sequence, task, index) {
                    return sequence.then(function() {
                        return checkNthTask(index);
                    }).then(function(result) {
                        if (flagFuture) {
                            stage.tasks[index].state = "future";
                            return;
                        }
                        if (flagNext) {
                            stage.tasks[index].state = "next";
                            flagNext = false;
                            flagFuture = true;
                            return;
                        }
                        if (task.state == "checked") {
                            if (result) return;
                            else {
                                sweetAlert({
                                    title:"Oops...", 
                                    text: task.errorMsg, 
                                    type: "error",
                                    html: true
                                });
                                stage.tasks[index].state = "error";
                                flagFuture = true;
                                return;
                            }
                        } else {
                            if (result) {
                                stage.tasks[index].state = "checked";
                                flagOnce = true;
                            } else {
                                if (flagOnce) {
                                    stage.tasks[index].state = "next";
                                } else {
                                    sweetAlert({
                                    title:"Oops...", 
                                    text: task.errorMsg, 
                                    type: "error",
                                    html: true
                                });
                                    stage.tasks[index].state = "error";
                                }
                                flagFuture = true;
                                return;
                            }
                        }
                    })
                }, Promise.resolve());
            }

            function registerEvents() {
                $('.run-button').click(function() {
                    checkTaskState().then(function() {
                        renderTaskList();
                    });
                })
            }

            function initTabs() {
                $('ul.tabs li:first').addClass('active');
                $('.tabs-content > section').hide();
                $('.tabs-content > section:first').show();
                $('ul.tabs li').on('click', function() {
                    $('ul.tabs li').removeClass('active');
                    $(this).addClass('active')
                    $('.tabs-content > section').hide();
                    var activeTab = $(this).find('a').attr('href');
                    $(activeTab).show();
                    return false;
                });
            }
            $('#title').html(stage.title);
            document.title = stage.title;
            //$('#desc').html(stage.description);
            for (var file in stage.files) {
                $('#file-tabs').append('<li><a href="#{0}">{1}</a></li>'.format(stage.files[file].mapping, file));
                $('#editors').append('<section id="{0}"><textarea id="editor-{0}">{1}</textarea></section>'.format(stage.files[file].mapping, stage.files[file].initialCode))
                files[stage.files[file].mapping] = CodeMirror.fromTextArea(document.getElementById('editor-{0}'.format(stage.files[file].mapping)),
                    stage.files[file].cmOption
                );
            }
            for (var file in files) {
                files[file].on('change', reload);
            }
            initTabs();
            reload();
            renderTaskList();
            registerEvents();
            resolve();

        });
    });
}

function nukeLoadingOverlay() {
    var fadePromise = new Promise(function(resolve, reject) {
        $('#loading').fadeOut(function() {
            resolve();
        });
    });
    fadePromise.then(function() {
        $('#loading').remove();
    });
}

function loadFromJSONfn(url) {
    fetch(url)
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            return loadStage(json);
        })
        .then(function() {
            nukeLoadingOverlay();
        })
        .catch(function(err) {
            sweetAlert("Oops...", "Something went wrong!", "error");
            console.log(err);
        });
}
