import * as kue from 'kue';
import * as configs from '../configs';

const queue = kue.createQueue();

queue.setMaxListeners(configs.update_queue_size + 5);

queue.on('job complete', function(id, result){
    kue.Job.get(id, function(err, job){
        if (err) return;
        job.remove(function(err){
            if (err) throw err;
        });
    });
});

export = queue;