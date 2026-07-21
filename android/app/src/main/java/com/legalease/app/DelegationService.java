package com.legalease.app;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;

public class DelegationService extends Service {
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
