import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import * as actions from './actions'
import Blacklist from '../../components/blacklist'

import { routeTitle, sectionTitle } from '../../base.css'
import styles from './style.css'

class SettingsContainer extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            isAddingEnabled: false
        }

        this.onAddClicked = this.onAddClicked.bind(this)
        this.onCancelAdding = this.onCancelAdding.bind(this)
        this.onNewBlacklistItemAdded = this.onNewBlacklistItemAdded.bind(this)
        this.onDeleteClicked = this.onDeleteClicked.bind(this)
    }

    onAddClicked() {
        this.setState({ isAddingEnabled: true })
    }

    onCancelAdding() {
        this.setState({ isAddingEnabled: false })
    }

    onNewBlacklistItemAdded(value) {
        // TODO(AM): Validation
        const { actions } = this.props

        actions.addNewBlacklistedSite({
            expression: value,
            dateAdded: new Date()
        })
    }

    onDeleteClicked(itemIndex) {
        // TODO(AM): Confirmation or undo
        const { actions } = this.props

        actions.deleteBlacklistedSite({
            index: itemIndex
        })
    }

    render() {
        return (
            <div>
                <h1 className={routeTitle}>Settings</h1>
                
                <section className={styles.section}>
                    <h2 className={sectionTitle}>Ignored Sites</h2>

                    <Blacklist blacklist={this.props.blacklist}
                               isAddingEnabled={this.state.isAddingEnabled}
                               onNewBlacklistItemAdded={this.onNewBlacklistItemAdded}
                               onAddClicked={this.onAddClicked}
                               onCancelAdding={this.onCancelAdding}
                               onDeleteClicked={this.onDeleteClicked} />
                </section>
            </div>
        )
    }
}

SettingsContainer.propTypes = {
    blacklist: PropTypes.array.isRequired
}

function mapStateToProps(state) {
    return {
        blacklist: state.settings.blacklist
    }
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(actions, dispatch)
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsContainer)
