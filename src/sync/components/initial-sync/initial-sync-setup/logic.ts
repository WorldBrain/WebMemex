import { UILogic, UIEvent } from 'ui-logic-core'
import TypedEventEmitter from 'typed-emitter'
import { InitialSyncEvents } from '@worldbrain/storex-sync/lib/integration/initial-sync'
import { FastSyncEvents } from '@worldbrain/storex-sync/lib/fast-sync'

type SyncSetupState = 'introduction' | 'pair' | 'sync' | 'done'

export interface InitialSyncSetupState {
    status: SyncSetupState
    initialSyncMessage?: string
    error?: string
    progressPct?: number
    stage?: string
}

export type InitialSyncSetupEvent = UIEvent<{
    start: {}
    backToIntroduction: {}
}>

export interface InitialSyncSetupDependencies {
    onClose?: () => void
    waitForInitialSyncConnected: () => Promise<any>
    waitForInitialSync: () => Promise<any>
    getInitialSyncMessage: () => Promise<string>
    getSyncEventEmitter: () => TypedEventEmitter<InitialSyncEvents>
}

export default class InitialSyncSetupLogic extends UILogic<
    InitialSyncSetupState,
    InitialSyncSetupEvent
> {
    prepared: number = 0
    eventEmitter: TypedEventEmitter<InitialSyncEvents> = null

    constructor(private dependencies: InitialSyncSetupDependencies) {
        super()
    }

    getInitialState(): InitialSyncSetupState {
        return {
            status: 'introduction',
            stage: '1/2',
        }
    }

    updateProgress = (event: Parameters<FastSyncEvents['progress']>[0]) => {
        // console.log('UI Logic received event [progress]:', event)

        this.emitMutation({
            progressPct: {
                $set:
                    event.progress.totalObjectsProcessed /
                    event.progress.objectCount,
            },
        })
    }

    updateRole = (event: Parameters<FastSyncEvents['roleSwitch']>[0]) => {
        // console.log('UI Logic received event [roleSwitch]:', event)

        // Currently assuming that this always happens once for two way sync, 1) A->B, 2) B+A->A
        this.emitMutation({
            progressPct: { $set: 0 },
            stage: { $set: `2/2` },
        })
    }

    updateError = (event: Parameters<FastSyncEvents['error']>[0]) => {
        // console.log('UI Logic received event [roleSwitch]:', event)

        this.emitMutation({
            error: { $set: event.error },
        })
    }

    registerListeners = () => {
        this.eventEmitter.on('progress', this.updateProgress)
        this.eventEmitter.on('roleSwitch', this.updateRole)
        this.eventEmitter.on('error', this.updateError)
    }

    cleanup() {
        if (this.eventEmitter != null) {
            this.eventEmitter.removeAllListeners('progress')
            this.eventEmitter.removeAllListeners('roleSwitch')
            this.eventEmitter.removeAllListeners('error')
        }
    }

    start = async () => {
        this.eventEmitter = this.dependencies.getSyncEventEmitter()
        this.registerListeners()

        this.emitMutation({
            status: { $set: 'pair' },
        })
        this.emitMutation({
            initialSyncMessage: {
                $set: await this.dependencies.getInitialSyncMessage(),
            },
        })

        try {
            await this.dependencies.waitForInitialSyncConnected()
            this.emitMutation({
                status: { $set: 'sync' },
            })
        } catch (e) {
            this.error(e)
        }

        try {
            await this.dependencies.waitForInitialSync()
            this.emitMutation({
                status: { $set: 'done' },
            })
        } catch (e) {
            this.error(e)
        }
    }

    backToIntroduction = () => {
        this.emitMutation({
            status: { $set: 'introduction' },
        })
    }

    error(e) {
        console.error(e)
        this.emitMutation({
            error: { $set: `${e}` },
        })
    }
}