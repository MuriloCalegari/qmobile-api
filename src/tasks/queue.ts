import * as kue from 'kue';
import * as configs from '../configs';

const queue = kue.createQueue();

queue.setMaxListeners(configs.update_queue_size + 5);

export = queue;
