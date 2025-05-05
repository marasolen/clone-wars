let episodeData, arcData;
const tooltipPadding = 15;

const resizeAndRender = () => {
    d3.selectAll(".visualization > *").remove();

    d3.selectAll("#radial-visualization").style("height", "70vh").attr("width", 1 * document.getElementById("radial-visualization").clientHeight)
    d3.selectAll("#saber-visualization").style("height", "50vh").attr("width", 2 * document.getElementById("saber-visualization").clientHeight)

    renderVisualization();

    d3.selectAll("text")
        .attr("font-size", function() { return d3.select(this).attr("text-multiplier") * 0.008 * document.getElementById("saber-visualization-container").clientWidth });

    d3.select("#tooltip")
        .style("border-radius", 0.02 * document.getElementById("saber-visualization-container").clientHeight + "px");

    d3.select("#disclaimer")
        .style("display", +d3.select("#saber-visualization").attr("width") > window.innerWidth ? "block" : "none");
};

window.onresize = resizeAndRender;

const setTooltip = (selection, innerHtml) => {
    selection
        .on('mouseover', (event, d) => {
            d3.select("#tooltip")
                .style("display", "block")
                .style("left", (event.pageX + tooltipPadding) + 'px')
                .style("top", (event.pageY + tooltipPadding) + 'px')
                .html(innerHtml(d));
        })
        .on("mousemove", (event) => {
            d3.select("#tooltip")
                .style("display", "block")
                .style("left", (event.pageX + tooltipPadding) + 'px')
                .style("top", (event.pageY + tooltipPadding) + 'px');
        })
        .on('mouseleave', () => {
            d3.select("#tooltip").style("display", "none");
        });
};

const renderRadialVisualization = () => {
    const containerWidth = document.getElementById("radial-visualization").clientWidth;
    const containerHeight = document.getElementById("radial-visualization").clientHeight;

    const margin = {
        top: 0.05 * containerHeight,
        right: 0.05 * containerWidth,
        bottom: 0.05 * containerHeight,
        left: 0.05 * containerWidth
    };

    const width = containerWidth - (margin.right + margin.left);
    const height = containerHeight - (margin.top + margin.bottom);

    const svg = d3.select(`#radial-visualization`);
    const chartArea = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const radiusScale = d3.scaleLinear().domain(d3.extent(episodeData.map(e => e.season))).range([width / 16, width / 2]);
    const angleScales = [...Array(8).keys()].map(season => d3.scaleBand().domain(episodeData.filter(d => d.season === season).map(d => d.number)).range([-0.5 * Math.PI + season / 16 * 2 * Math.PI, 1.5 * Math.PI + season / 16 * 2 * Math.PI]));

    const line = d3.line()
        .x(d => radiusScale(d.season) * Math.cos(angleScales[d.season](d.number)))
        .y(d => radiusScale(d.season) * Math.sin(angleScales[d.season](d.number)));

    const constellationLines = chartArea.selectAll(".constellation-line")
        .data(arcData)
        .join("path")
        .attr("class", "constellation-line")
        .attr("stroke", d => d.abnormal ? "white" : "#444444")
        .attr("stroke-width", d => d.abnormal ? width / 300 : width / 400)
        .attr("fill", "none")
        .attr("transform", `translate(${width / 2}, ${height / 2})`)
        .attr("stroke-opacity", 0.7)
        .attr("d", d => line(d.episodes));

    setTooltip(constellationLines, d => `<b>${d.name}</b><br><i>${d.episodes.map(e => "S" + e.season + "E" + String(e.number).padStart(2, "0")).join(", ")}</i>`);

    const seasonColours = ["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#bcbd22"];

    const episodeDots = chartArea.selectAll(".episode-dot")
        .data(episodeData)
        .join("circle")
        .attr("class", "episode-dot")
        .attr("fill", d => seasonColours[d.season])
        .attr("transform", `translate(${width / 2}, ${height / 2})`)
        .attr("cx", d => radiusScale(d.season) * Math.cos(angleScales[d.season](d.number)))
        .attr("cy", d => radiusScale(d.season) * Math.sin(angleScales[d.season](d.number)))
        .attr("r", 1 * width / 200);

    setTooltip(episodeDots, d => `<b>${d.name}</b><br><i>${d.date.format("MMMM D, YYYY")}</i><br><i>season ${d.season}, episode ${d.number}</i>`);
};

const renderSaberVisualization = () => {
    const containerWidth = document.getElementById("saber-visualization").clientWidth;
    const containerHeight = document.getElementById("saber-visualization").clientHeight;

    const margin = {
        top: 0.05 * containerHeight,
        right: 0.1 * containerWidth,
        bottom: 0.05 * containerHeight,
        left: 0.1 * containerWidth
    };

    const width = containerWidth - (margin.right + margin.left);
    const height = containerHeight - (margin.top + margin.bottom);

    const svg = d3.select(`#saber-visualization`);
    const chartArea = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const yScale = d3.scaleLinear().domain([-6, d3.max(episodeData.map(e => e.number))]).range([height, 0]);
    const xScale = d3.scaleTime().domain(d3.extent(episodeData.map(e => e.date.toDate()))).range([0, width]);

    const line = d3.line()
        .x(d => xScale(d.date.toDate()))
        .y(d => yScale(d.number))
        .curve(d3.curveNatural);

    const seasonColours = ["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#bcbd22"];

    chartArea.selectAll(".saber-line")
        .data(d3.rollups(episodeData, g => g, d => d.season))
        .join("path")
        .attr("class", "saber-line")
        .attr("stroke", d => seasonColours[d[0]])
        .attr("stroke-width", width / 90)
        .attr("fill", "none")
        .attr("stroke-opacity", 1)
        .attr("d", d => line(d[1]));

    chartArea.selectAll(".hilt-line")
        .data(d3.rollups(episodeData, g => g, d => d.season))
        .join("path")
        .attr("class", "hilt-line")
        .attr("stroke", "grey")
        .attr("stroke-width", width / 80)
        .attr("fill", "none")
        .attr("stroke-opacity", 1)
        .attr("d", d => line([{ "date": d[1][0].date, "number": -3 }, d[1][0]]));

    const episodeDots = chartArea.selectAll(".episode-dot")
        .data(episodeData)
        .join("circle")
        .attr("class", "episode-dot")
        .attr("fill", d => "white")
        .attr("cx", d => xScale(d.date.toDate()))
        .attr("cy", d => yScale(d.number))
        .attr("r", 1 * width / 200);

    setTooltip(episodeDots, d => `<b>${d.name}</b><br><i>${d.date.format("MMMM D, YYYY")}</i><br><i>season ${d.season}, episode ${d.number}</i>`);

    chartArea.selectAll(".year-text")
        .data([...Array(14).keys()].map(d => dayjs((2008 + d) + "-01-01")))
        .join("text")
        .attr("class", "year-text")
        .attr("fill", "white")
        .attr("text-anchor", "middle")
        .attr("transform", d => `translate(${xScale(d.toDate())}, ${height})`)
        .text(d => d.format("YYYY"))
};

const renderVisualization = () => {
    renderRadialVisualization();
    renderSaberVisualization();
};

Promise.all([d3.json('data/episode-data.json'),d3.json('data/arc-data.json')]).then(([_episodeData, _arcData]) => {
    dayjs.extend(window.dayjs_plugin_dayOfYear) 

    episodeData = _episodeData;
    episodeData.forEach(episode => {
        episode.date = dayjs(episode.date);
    });

    const episodeMap = d3.rollup(episodeData, g => g[0], d => d.season, d => d.number);

    arcData = [];
    _arcData.forEach(arc => {
        arc = arc.trim();
        const arcItem = {};
        arcItem.name = arc.slice(1, arc.indexOf(" Arc"));
        arcItem.episodes = arc.slice(arc.indexOf("]") + 2).split(", ").map(e => e.slice(e.indexOf("(") + 1, e.indexOf(")"))).map(e => {
            return { season: +e.slice(0, 1), episode: +e.slice(1, 3) }
        }).map(e => episodeMap.get(e.season).get(e.episode));
        arcItem.abnormal = false;

        const season = arcItem.episodes[0].season;
        let episode = arcItem.episodes[0].number;
        for (let i = 0; i < arcItem.episodes.length; i++) {
            if (arcItem.episodes[i].season !== season || arcItem.episodes[i].number !== episode + i) {
                arcItem.abnormal = true;
            }
        }        

        arcData.push(arcItem);
    });

    resizeAndRender();
});