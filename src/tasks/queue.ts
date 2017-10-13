import * as kue from 'kue';
import * as configs from '../configs';

const queue = kue.createQueue();

queue.setMaxListeners(configs.update_queue_size + 5);

queue.on('job complete', id => {
    kue.Job.get(id, (err, job) => {
        if (err) return;
        job.remove(err => {
            if (err) throw err;
        });
    });
});

export = queue;