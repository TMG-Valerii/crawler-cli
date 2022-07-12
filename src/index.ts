import {Runner} from './classes/Runner.class';

new Runner('https://zoom.us', 1).run()
    .then(console.log)
    .catch(console.log)
