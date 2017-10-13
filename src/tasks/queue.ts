import * as kue from 'kue';

const queue = kue.createQueue();

queue.on('job complete', function(id, result){
    kue.Job.get(id, function(err, job){
        if (err) return;
        job.remove(function(err){
            if (err) throw err;
        });
    });
});

export = queue;