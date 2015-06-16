if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

function loadStage(stage) {
    return new Promise(function(resolve, reject) {
        stuff('secure/index.html', document.getElementById("preview"), function(context) {
            var files = {};
            var compiled_template = Hogan.compile(stage.template);
            var t = null;

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
            $('#desc').html(stage.description);
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
            return response.text();
        })
        .then(function(text) {
            return loadStage(JSONfn.parse(text));
        })
        .then(function() {
            nukeLoadingOverlay();
        })
        .catch(function(err) {
            sweetAlert("Oops...", "Something went wrong!", "error");
        });
}
