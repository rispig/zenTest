$(function () {
    var statsBaseUrl   = "http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&key=FE74F2A2F86EF560D074595E52B3E0F5&steamid=%id%",
        profileBaseUrl = "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=FE74F2A2F86EF560D074595E52B3E0F5&steamids=%id%",
        template       = $('#template').html();

    Mustache.parse(template);

    $('.profile-id')
        .keypress(function (e) {
            if (e.keyCode === 13) {
                $('.search').click();
            }
        })
        .focus();

    $('.search')
        .click(function() {
        var pId        = $('.profile-id').val(),
            statsUrl   = encodeURIComponent(statsBaseUrl.replace('%id%', pId)),
            profileUrl = encodeURIComponent(profileBaseUrl.replace('%id', pId));

        async.parallel({
            stats: function (callback) {
                $.getJSON('https://jsonp.afeld.me/?callback=?&url='+statsUrl, function(data){
                    callback(null, data);
                }).fail(function (xhr, text) {
                    callback(text);
                });
            },
            profile: function (callback) {
                $.getJSON('https://jsonp.afeld.me/?callback=?&url='+profileUrl, function(data){
                    callback(null, data);
                }).fail(function (xhr, text) {
                    callback(text);
                });
            }
        },
        function (err, results) {
            if (err) return alert("ERROR: " + err);
            refreshView(template, results.stats.playerstats.stats, results.profile.response.players[0]);
        });
    });
});

function refreshView(template, stats, profile) {
    function getStatValueByName(statName) {
        return (_.find(stats, function (stat) {
            return stat.name === statName;
        }).value);
    }

    function getStateClass(state) {
        var offline = {0:"1", 2:"1"},
            away    = {3:"1", 4:"1"};

        if (state in offline) {
            return "offline";
        }

        if (state in away) {
            return "away";
        }

        return "online";
    }

    var deaths    = getStatValueByName("total_deaths"),
        kills     = getStatValueByName("total_kills"),
        wins      = getStatValueByName("total_matches_won"),
        played    = getStatValueByName("total_matches_played"),
        hits      = getStatValueByName("total_shots_hit"),
        fired     = getStatValueByName("total_shots_fired"),
        mvp       = getStatValueByName("total_mvps"),
        time      = getStatValueByName("total_time_played") / 60;
        headshots = getStatValueByName("total_kills_headshot");


    var options = {
        kills    : kills,
        deaths   : deaths,
        kdr      : (kills/deaths).toFixed(2),
        name     : profile.personaname,
        avatar   : profile.avatarfull,
        status   : getStateClass(profile.personastate),
        winRate  : ((wins/played) * 100).toFixed(2),
        accuracy : ((hits/fired) * 100).toFixed(2),
        mvp      : mvp,
        time     : Math.floor(time/60)+"h." + Math.floor(time%60)+"m.",
        headshot : (headshots/kills).toFixed(2)
    };

    $('.widget').html(Mustache.render(template, options));
}